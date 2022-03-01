import Human from '@vladmandic/human'
import './style.css'

// inspo https://github.com/healeycodes/if-sad-send-cat/blob/main/web/index.html
// TODO:
// 5. networking??? (TODO) screen pulses with other peoples feelings, and words grow slightly larger in size corresponding to the emotions

// line break
// type Poem = { text: string; expand?: (Poem | string | BREAK)[], }


const AllEmotions = ['sad', 'angry', 'disgust', 'fear', 'happy', 'surprise', 'neutral']
const PositiveEmotions = ['happy', 'surprise', 'neutral']

const EmotionElements =  Object.assign({}, ...Object.entries({ ...AllEmotions }).map(([a,b]) => ({ [b]: [] })))

const getEmotionColor = (emotion) => {
  if (['angry, disgust'].includes(emotion)) {
    return 'red';
  }

  if (['happy', 'surprise'].includes(emotion)) {
    return 'green';
  }

  if (['sad', 'fear'].includes(emotion)) {
    return 'blue';
  }

  return 'black';
}

const BREAK = "|";

const poem = [
  { text: "i carry your heart with me", expand: ["(i carry it in", BREAK, "my heart)"] },
  { text: "i am never without it", expand: ["(anywhere", BREAK, "i go you go,my dear;and whatever is done", BREAK, "by only me is your doing,my darling)", BREAK]},
  { text: [". . . . . . . . . . . . . . . . . . . . . . . . . . . i fear", BREAK, "no fate"],
    expand: ["(for ", { text: "you are my fate", emotion: "happy" }, " ,my sweet)"] },
  { text: ["i want", BREAK, { emotion: 'sad', text: "no world" }], expand: [" (for ", { text: "beautiful", emotion: "happy" }, " you are my world, my true)", BREAK]},
  { text: ["and it's you are whatever a moon has always meant", BREAK]},
  { text: ["and whatever a sun will always sing is you", BREAK]},
  { text: [BREAK]},

  { text: [". . .", BREAK]},
  { text: ["here is ", { text: "the deepest secret", emotion: "sad" }, " nobody knows", BREAK],
    expand: [
      "(here is the root of the root and the bud of the bud", BREAK,
      "and the sky of the sky of ", { emotion: 'surprise', text: "a tree called life" }, ";which grows", BREAK,
      "higher than soul can hope or mind can hide)", BREAK,
    ]},
  { text: ["and this is ", {text: "the wonder", emotion: "surprise" }, " that's keeping the stars apart", BREAK]},
  { text: [". . .", BREAK]},
  { text: "i carry your heart", expand: "(i carry it in my heart)" }
];

const renderPoem = (poem) => {
  let parent = document.createElement("p");
  let curChild = document.createElement("div");

  const makeText = (txt) => {
    if (txt instanceof Array) {
      txt.forEach((msg) => {
        if (msg === BREAK) {
          parent.appendChild(curChild);
          curChild = document.createElement("div")
        } else if (msg instanceof Object) {
          let colorChild = document.createElement("span");
          colorChild.appendChild(document.createTextNode(msg.text));
          EmotionElements[msg.emotion].push(colorChild);
          curChild.appendChild(colorChild);
          colorChild.classList.add("specialColor");
        } else {
          curChild.appendChild(document.createTextNode(msg));
        }
      })
    } else {
      curChild.appendChild(document.createTextNode(txt));
    }
  }

  poem.forEach(({ text, expand }) => {
    makeText(text);
    if(expand) {
      makeText(expand);
    }
  })

  parent.appendChild(curChild);
  return parent;
}

const container = document.getElementById("text-container-inner");
container.appendChild(renderPoem(poem));


const inputVideo = document.querySelector('#webcam')
const outputCanvas = document.querySelector('#view')
const debugPre = document.querySelector('#debug')
const context = outputCanvas.getContext('2d')


// get max of emotions at any given time
const getDominantEmotion = (emotions) => {
  const emotionRatings = emotions.map(({ score, emotion }) => score);
  const maxEmotion = Math.max(...emotionRatings);
  return emotions[emotionRatings.indexOf(maxEmotion)].emotion;
}

// color the tags affiliated with a particular emotion
const colorEmotion = (curEmotion) => {
  Object.keys(EmotionElements).forEach((emotion) => {
    if (curEmotion === emotion) {
      EmotionElements[emotion].forEach((elem) => {
        console.log(`adding ${emotion}`)
        elem.classList.add(`emotion_${getEmotionColor(emotion)}`);
      })
    } else {
      EmotionElements[emotion].forEach((elem) => {
        console.log(`removing ${emotion}`)
        elem.classList.remove(`emotion_${getEmotionColor(emotion)}`);
      })
    }
  })
}

// get the emotion score (positive or negative) associated with someone's expression
const getEmotionScore = (emotions) => {
  let good = 0
  let bad = 0
  let debugText = []
  emotions.forEach(kind => {
    debugText.push(`${kind.emotion}: ${kind.score}`)
    if (PositiveEmotions.includes(kind.emotion)) {
      good += kind.score
    } else {
      bad += kind.score
    }
  })
  const overall = good - bad;
  return overall;
}

function human() {
  const human = new Human( { modelBasePath: 'models/' })
// { backend: 'webgl', modelPath: 'file://models.json' }

  let i = 0;

  async function detectVideo() {
    if (++i % 240 === 0) { // every 4 seconds:
      // `inputVideo` is a video of a webcam stream
      const result = await human.detect(inputVideo)

      // `result` contains an array of faces along with emotion weights
      if (result.face.length === 1) {
        const faceEmotions = result.face[0].emotion;
        console.log(`emotion score: ${getEmotionScore(faceEmotions)}`);

        const domEmotion = getDominantEmotion(faceEmotions);
        console.log(`dominant emotion: ${domEmotion}`);
        colorEmotion(domEmotion);
      }
      context.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    }
    requestAnimationFrame(detectVideo);
  }

  detectVideo();
}

window.navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
  inputVideo.srcObject = stream
  inputVideo.onloadedmetadata = (e) => {
    inputVideo.play()
  }
  console.log("starting to play")
  human()
})
  .catch(() => {
    console.log('missing webcam permissions')
  })

