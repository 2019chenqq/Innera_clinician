const patients = [
  {
    id: "P001",
    fullName: "林怡庭",
    queueNumber: 18,
    registrationTime: "13:42",
    visitType: "複診",

    linked: true,
    attention: true,
    viewed: false,

    status: "狀態下降",
    statusType: "low",

    mood: "2.1 / 5",
    moodSub: "↓ 0.8",

    sleep: "4.8 hr",
    sleepSub: "連續 3 日偏低",

    changes: [
      { text: "睡眠下降", type: "danger" },
      { text: "新增用藥", type: "" }
    ],

    updated: "2 小時前"
  },

  {
    id: "P002",
    fullName: "王子安",
    queueNumber: 20,
    registrationTime: "13:45",
    visitType: "複診",

    linked: true,
    attention: false,
    viewed: true,

    status: "大致穩定",
    statusType: "stable",

    mood: "3.6 / 5",
    moodSub: "與上週相近",

    sleep: "6.7 hr",
    sleepSub: "睡眠穩定",

    changes: [
      { text: "無明顯變化", type: "" }
    ],

    updated: "今天 09:12"
  },

  {
    id: "P003",
    fullName: "陳志明",
    queueNumber: 36,
    registrationTime: "14:26",
    visitType: "複診",

    linked: true,
    attention: true,
    viewed: false,

    status: "波動增加",
    statusType: "medium",

    mood: "3.0 / 5",
    moodSub: "波動較大",

    sleep: "5.9 hr",
    sleepSub: "入睡時間延後",

    changes: [
      { text: "情緒波動", type: "warning" },
      { text: "壓力事件", type: "" }
    ],

    updated: "昨天 23:48"
  },

  {
    id: "P004",
    fullName: "李文翔",
    queueNumber: 40,
    registrationTime: "14:35",
    visitType: "複診",

    linked: false,
    attention: false,
    viewed: false,

    updated: "—"
  }
];

// 讓 Firebase 同步模組可安全取得同一份患者陣列。
window.patients = patients;

const demoNames = [
  "張雅雯",
  "黃冠宇",
  "吳佳穎",
  "劉家豪",
  "蔡依庭",
  "楊承恩",
  "許雅婷",
  "鄭宇翔",
  "謝宜蓁",
  "郭柏廷",
  "洪郁晴",
  "邱冠霖",
  "曾心怡",
  "廖俊傑",
  "賴思妤",
  "徐子軒",
  "周欣怡",
  "葉家瑋",
  "蘇品妤",
  "莊博文",
  "江怡君",
  "何宇辰",
  "羅雅琪",
  "高承翰"
];


demoNames.forEach((name, index) => {

  const number = index + 5;

  const queueNumber =
    42 + index * 2;


  /*
    前 14 位設定成已連結
    加上前面原本 3 位
    Demo 數字可以之後再調
  */

  const linked =
    index < 15;


  /*
    額外兩位設定需關注
  */

  const attention =
    index === 3 ||
    index === 9;


  const viewed =
    index % 3 !== 0;


  patients.push({

    id:
      `P${String(number).padStart(3, "0")}`,

    fullName: name,

    queueNumber,

    registrationTime:
      generateRegistrationTime(index),

    visitType:
      index % 6 === 0
        ? "初診"
        : "複診",

    linked,

    attention:
      linked && attention,

    viewed,

    status:
      !linked
        ? null
        : attention
          ? "波動增加"
          : "大致穩定",

    statusType:
      attention
        ? "medium"
        : "stable",

    mood:
      linked
        ? `${(
            2.8 +
            Math.random() * 1.3
          ).toFixed(1)} / 5`
        : null,

    moodSub:
      linked
        ? "與近期相近"
        : null,

    sleep:
      linked
        ? `${(
            5.5 +
            Math.random() * 2
          ).toFixed(1)} hr`
        : null,

    sleepSub:
      linked
        ? "近期平均"
        : null,

    changes:
      linked
        ? attention
          ? [
              {
                text: "近期波動",
                type: "warning"
              }
            ]
          : [
              {
                text: "無明顯變化",
                type: ""
              }
            ]
        : [],

    updated:
      linked
        ? `${index + 1} 小時前`
        : "—"

  });

});


function generateRegistrationTime(index) {

  const startMinutes =
    13 * 60 + 30;

  const totalMinutes =
    startMinutes + index * 5;

  const hour =
    Math.floor(
      totalMinutes / 60
    );

  const minute =
    totalMinutes % 60;

  return (
    String(hour).padStart(2, "0") +
    ":" +
    String(minute).padStart(2, "0")
  );
}

function maskPatientName(name) {
  const trimmed = String(name ?? "").trim();

  if (!trimmed) {
    return "未命名個案";
  }

  if (trimmed.length === 1) {
    return trimmed;
  }

  if (trimmed.length === 2) {
    return `${trimmed[0]}○`;
  }

  return `${trimmed[0]}○${trimmed[trimmed.length - 1]}`;
}