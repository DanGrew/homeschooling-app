const LESSON = {
  lessonId: "lesson_001",
  title: "David and Goliath",
  clips: ["david-and-goliath-p1", "david-and-goliath-p2", "david-and-goliath-p3", "david-and-goliath-p4"]
};

const CLIPS = {
  "david-and-goliath-p1": { id: "david-and-goliath-p1", title: "David and Goliath", audioUrl: "david-and-goliath/audio/david-and-goliath-p1.mp3", type: "story" },
  "david-and-goliath-p2": { id: "david-and-goliath-p2", title: "David and Goliath", audioUrl: "david-and-goliath/audio/david-and-goliath-p2.mp3", type: "story" },
  "david-and-goliath-p3": { id: "david-and-goliath-p3", title: "David and Goliath", audioUrl: "david-and-goliath/audio/david-and-goliath-p3.mp3", type: "story" },
  "david-and-goliath-p4": { id: "david-and-goliath-p4", title: "David and Goliath", audioUrl: "david-and-goliath/audio/david-and-goliath-p4.mp3", type: "story" }
};

const ANNOTATIONS = {
  "david-and-goliath-p1": {
    clipId: "david-and-goliath-p1",
    segments: [
      { text: "King Saul was the first king of Israel.", words: [ { w: "King", t: 0.232 }, { w: "Saul", t: 0.457 }, { w: "was", t: 0.717 }, { w: "the", t: 0.853 }, { w: "first", t: 1.012 }, { w: "king", t: 1.435 }, { w: "of", t: 1.73 }, { w: "Israel.", t: 1.889 } ] },
      { text: "One day, the Philistines came to fight.", words: [ { w: "One", t: 2.652 }, { w: "day,", t: 3.014 }, { w: "the", t: 3.648 }, { w: "Philistines", t: 3.791 }, { w: "came", t: 4.517 }, { w: "to", t: 4.814 }, { w: "fight.", t: 4.961 } ] },
      { text: "Their giant, Goliath, was big and scary;", words: [ { w: "Their", t: 5.848 }, { w: "giant,", t: 6.114 }, { w: "Goliath,", t: 6.658 }, { w: "was", t: 7.387 }, { w: "big", t: 7.786 }, { w: "and", t: 8.142 }, { w: "scary;", t: 8.313 } ] },
      { text: "and no one wanted to face him.", words: [ { w: "and", t: 9.274 }, { w: "no", t: 9.521 }, { w: "one", t: 9.821 }, { w: "wanted", t: 10.047 }, { w: "to", t: 10.364 }, { w: "face", t: 10.486 }, { w: "him.", t: 10.863 } ] }
    ]
  },
  "david-and-goliath-p2": {
    clipId: "david-and-goliath-p2",
    segments: [
      { text: "Then young David came to the camp, and David loved God and trusted Him.", words: [ { w: "Then", t: 0.138 }, { w: "young", t: 0.431 }, { w: "David", t: 0.709 }, { w: "came", t: 1.051 }, { w: "to", t: 1.284 }, { w: "the", t: 1.392 }, { w: "camp,", t: 1.531 }, { w: "and", t: 2.002 }, { w: "David", t: 2.24 }, { w: "loved", t: 2.548 }, { w: "God", t: 2.906 }, { w: "and", t: 3.383 }, { w: "trusted", t: 3.594 }, { w: "Him.", t: 4.019 } ] },
      { text: "David said, \u201cGod is with me.\u201d", words: [ { w: "David", t: 4.87 }, { w: "said,", t: 5.195 }, { w: "\u201cGod", t: 6.044 }, { w: "is", t: 6.239 }, { w: "with", t: 6.422 }, { w: "me.\u201d", t: 6.649 } ] },
      { text: "He picked up his sling and five smooth stones from the stream.", words: [ { w: "He", t: 7.335 }, { w: "picked", t: 7.566 }, { w: "up", t: 7.767 }, { w: "his", t: 7.921 }, { w: "sling", t: 8.111 }, { w: "and", t: 8.526 }, { w: "five", t: 8.776 }, { w: "smooth", t: 9.04 }, { w: "stones", t: 9.431 }, { w: "from", t: 9.885 }, { w: "the", t: 10.046 }, { w: "stream.", t: 10.148 } ] }
    ]
  },
  "david-and-goliath-p3": {
    clipId: "david-and-goliath-p3",
    segments: [
      { text: "David swung his sling and one stone flew through the air.", words: [ { w: "David", t: 0.152 }, { w: "swung", t: 0.494 }, { w: "his", t: 0.782 }, { w: "sling", t: 0.992 }, { w: "and", t: 1.329 }, { w: "one", t: 1.474 }, { w: "stone", t: 1.728 }, { w: "flew", t: 2.132 }, { w: "through", t: 2.555 }, { w: "the", t: 2.688 }, { w: "air.", t: 2.847 } ] },
      { text: "It hit Goliath on the head and the giant fell down.", words: [ { w: "It", t: 3.543 }, { w: "hit", t: 3.816 }, { w: "Goliath", t: 4.068 }, { w: "on", t: 4.509 }, { w: "the", t: 4.631 }, { w: "head", t: 4.74 }, { w: "and", t: 4.984 }, { w: "the", t: 5.178 }, { w: "giant", t: 5.42 }, { w: "fell", t: 5.789 }, { w: "down.", t: 6.016 } ] },
      { text: "David had won, and everyone cheered.", words: [ { w: "David", t: 6.98 }, { w: "had", t: 7.35 }, { w: "won,", t: 7.487 }, { w: "and", t: 8.025 }, { w: "everyone", t: 8.341 }, { w: "cheered.", t: 8.867 } ] }
    ]
  },
  "david-and-goliath-p4": {
    clipId: "david-and-goliath-p4",
    segments: [
      { text: "Everyone loved David after that day.", words: [ { w: "Everyone", t: 0.096 }, { w: "loved", t: 0.502 }, { w: "David", t: 0.839 }, { w: "after", t: 1.243 }, { w: "that", t: 1.573 }, { w: "day.", t: 1.856 } ] },
      { text: "He became the next king of Israel.", words: [ { w: "He", t: 2.554 }, { w: "became", t: 2.762 }, { w: "the", t: 3.154 }, { w: "next", t: 3.313 }, { w: "king", t: 3.665 }, { w: "of", t: 3.782 }, { w: "Israel.", t: 3.909 } ] }
    ]
  }
};
