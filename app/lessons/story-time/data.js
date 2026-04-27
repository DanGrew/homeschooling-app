const LESSON = {
  lessonId: "lesson_001",
  title: "David and Goliath",
  clips: ["saul-first-line"]
};

const CLIPS = {
  "saul-first-line": {
    id: "saul-first-line",
    title: "David and Goliath",
    audioUrl: "audio/david-and-goliath-opener.mpeg",
    type: "story"
  }
};

const ANNOTATIONS = {
  "saul-first-line": {
    clipId: "saul-first-line",
    segments: [
      {
        text: "Saul was the first king of Israel",
        words: [
          { w: "Saul", t: 0.002 },
          { w: "was", t: 0.52 },
          { w: "the", t: 0.745 },
          { w: "first", t: 0.889 },
          { w: "king", t: 1.249 },
          { w: "of", t: 1.488 },
          { w: "Israel", t: 1.575 }
        ]
      },
      {
        text: "He had a problem with the Philistines",
        words: [
          { w: "He", t: 2.314 },
          { w: "had", t: 2.514 },
          { w: "a", t: 2.677 },
          { w: "problem", t: 2.829 },
          { w: "with", t: 3.379 },
          { w: "the", t: 3.578 },
          { w: "Philistines", t: 3.743 }
        ]
      }
    ]
  }
};
