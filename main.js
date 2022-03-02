import Human from '@vladmandic/human'
import './style.css'

// type Poem = { text: string; expand?: (Poem | string | BREAK)[], }

const AllEmotions = ['sad', 'angry', 'disgust', 'fear', 'happy', 'surprise', 'neutral']
const PositiveEmotions = ['happy', 'surprise', 'neutral']

// holding html elements for every emotion
const EmotionElements = Object.assign({}, ...Object.entries({ ...AllEmotions }).map(([a,b]) => ({ [b]: [] })))

// emojis corresponding to each emotion
const EmotionEmojis = {
  sad: ': (',
  angry: '>:(',
  disgust: ':#',
  fear: 'D:',
  happy: ': )',
  surprise:': O',
  neutral: ': |',
}

// obtain the color of an emotion from its name
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

// by e. e. cummings
const poem = [
  { text: ["i carry ", { text: "your heart", emotion: "neutral" }, " with me"], expand: ["(i carry it in", BREAK, { text: "my heart", emotion: "happy" }, ")"] },
  { text: "i am never without it", expand: ["(anywhere", BREAK, { text: "i go you go", emotion: "sad"}, ",my dear;and whatever is done", BREAK, "by only me is your doing,my darling)", BREAK]},
  { text: [". . . . . . . . . . . . . . . . . . . . . . . . . . . ", { text: "i fear", emotion: "fear" }, BREAK, "no fate"],
    expand: ["(for ", { text: "you are my fate", emotion: "happy" }, " ,my sweet)"] },
  { text: ["i want", BREAK, { emotion: 'sad', text: "no world" }], expand: [" (for ", { text: "beautiful", emotion: "happy" }, " you are my world, my true)", BREAK]},
  { text: ["and it's you are ", { text: "whatever a moon", emotion: "sad" }, " has always meant", BREAK]},
  { text: ["and ", { text: "whatever a sun will always sing is you", emotion: "surprise" }, BREAK]},
  { text: [BREAK]},

  { text: [". . .", BREAK]},
  { text: ["here is ", { text: "the deepest secret", emotion: "sad" }, " nobody knows", BREAK],
    expand: [
      "(here is ", { text: "the root of the root", emotion: "neutral" }, "and the bud of the bud", BREAK,
      "and the sky of the sky of ", { emotion: 'surprise', text: "a tree called life" }, ";which grows", BREAK,
      { text: "higher than soul", emotion: "happy" }, " can hope or ", { text: "mind can hide", emotion: "sad" }, ")", BREAK,
    ]},
  { text: ["and this is ", {text: "the wonder", emotion: "surprise" }, " ", { emotion: "disgust", text: "that's keeping the stars apart"}, BREAK]},
  { text: [". . .", BREAK]},
  { text: ["i carry ", { text: "your heart", emotion: "sad" }], expand: [{ emotion: "happy", text: "(i carry it in my heart)"}] }
];

// render a poem that follows the format above to a webpage!
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

// --- video work ---

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

const EmojiList = document.getElementById("emojiList");

// log emotion as an emoji
const logEmoji = (curEmotion) => {
  const emoji = document.createElement("div")
  emoji.classList.add("singleEmoji")
  emoji.appendChild(document.createTextNode(EmotionEmojis[curEmotion]))
  EmojiList.appendChild(emoji)
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


const human = new Human( { modelBasePath: 'models/' })

// start face detection every half a second
function startHuman() {
  let i = 0;

  async function detectVideo() {
    if (++i % 30 === 0) { // every second:
      // `inputVideo` is a video of a webcam stream
      const result = await human.detect(inputVideo)

      // `result` contains an array of faces along with emotion weights
      if (result.face.length === 1) {
        const faceEmotions = result.face[0].emotion;
        console.log(`emotion score: ${getEmotionScore(faceEmotions)}`);

        const domEmotion = getDominantEmotion(faceEmotions);
        console.log(`dominant emotion: ${domEmotion}`);
        colorEmotion(domEmotion);
        logEmoji(domEmotion);
      }
      context.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    }
    requestAnimationFrame(detectVideo);
  }

  detectVideo();
}

const startVideo = () => {
  console.log("starting video!")
  window.navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
    inputVideo.srcObject = stream
    inputVideo.onloadedmetadata = (e) => {
      inputVideo.play()
    }
    console.log("starting to play")
    document.getElementById("cameraIcon").style.display = "none";
    startHuman()
  })
    .catch(() => {
      console.log('missing webcam permissions')
    })

};

startVideo()

