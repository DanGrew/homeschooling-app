const LESSON = {
  lessonId: "lesson_001",
  title: "Baa Baa Black Sheep",
  clips: ["clip_001"]
};

const CLIPS = {
  clip_001: {
    id: "clip_001",
    title: "Baa Baa Black Sheep",
    audioUrl: "audio/baa-baa.mp3",
    type: "song"
  }
};

const ANNOTATIONS = {
  clip_001: {
    clipId: "clip_001",
    segments: [
      {
        text: "Baa baa black sheep",
        words: [
          { w: "Baa", t: 0.2 },
          { w: "baa", t: 0.8 },
          { w: "black", t: 1.4 },
          { w: "sheep,", t: 2.0 }
        ]
      },
      {
        text: "Have you any wool?",
        words: [
          { w: "Have", t: 3.1 },
          { w: "you", t: 3.5 },
          { w: "any", t: 3.9 },
          { w: "wool?", t: 4.3 }
        ]
      },
      {
        text: "Yes sir, yes sir,",
        words: [
          { w: "Yes", t: 5.2 },
          { w: "sir,", t: 5.8 },
          { w: "yes", t: 6.5 },
          { w: "sir,", t: 7.0 }
        ]
      },
      {
        text: "Three bags full.",
        words: [
          { w: "Three", t: 7.8 },
          { w: "bags", t: 8.4 },
          { w: "full.", t: 9.0 }
        ]
      }
    ]
  }
};
