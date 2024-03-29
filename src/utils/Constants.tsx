export interface ClockProps {
  data: {
    start: number,
    mid: number,
    end: number
  }
}


export const oneday = 1000 * 60 * 60 * 24;
export const today = new Date();


export const movementDefinitions = new Map<string, { movements: string[], theme: { inColor: string, outColor: string } }>([
  ["Shoulder", {
    movements: [
      "FacePull",
      "侧平举",
      "推举"
    ],
    theme: {
      outColor: "#ffff00",
      inColor: "#ffff88",
    },
  }],
  ["Chest", {
    movements: [
      "上斜卧推",
      "上斜",
      "卧推",
      "飞鸟",
      "哑铃飞鸟",
      "平板哑铃",
      "平板飞鸟"
    ],
    theme: {
      outColor: "#fffc00",
      inColor: "#aeff4d",
    }
  }],
  ["Tricep", {
    movements: [
      "屈伸",
      "碎裂者"
    ],
    theme: {
      outColor: "#fc4a1a",
      inColor: "#f7b733",
    }
  }],
  ["Back", {
    movements: [
      "下拉",
      "划船",
      "反手杠铃划船",
      "杠铃划船",
      "绳索划船",
      "T杆划船"
    ],
    theme: {
      outColor: "#0de8ce",
      inColor: "#00f260",
    }
  }],
  ["Bicep", {
    movements: [
      "哑铃弯举",
      "杠铃弯举",
      "弯举"
    ],
    theme: {
      outColor: "#0d5ee8",
      inColor: "#0d87e8",
    }
  }],
  ["Legs", {
    movements: [
      "并脚蹲",
      "深蹲",
      "窄蹲",
      "硬拉"
    ],
    theme: {
      outColor: "#ba12bb",
      inColor: "#ff00cc",
    }
  }],
  ["Cardio", {
    movements: [
      "跑步",
      "慢跑",
      "快跑",
    ],
    theme: {
      inColor: "#333333",
      outColor: "#111111"
    }
  }],
]);

export const sampleRecordsRaw = `2023-02-16 Chest
卧推 40kg 12 12 30kg 11 11 
跑步 5km 15 20 180bpm 5

2023-02-17 Back
下拉 21.25kg 12 12 35lb 12 12
推举 10kg 12 12 12 11
侧平举 4kg 15 15 15 14
跑步 5km 15 20

2023-02-20 Chest
卧推 45kg 12 12 10 9

2023-02-24 Chest
卧推 47.5kg 12 12 11 9

2023-02-25 Cardio
卧推 47.5kg 12 12 11 9
跑步 5km 15 20

2023-02-26 Back
下拉 21.25kg 12 12 12 12

2023-02-28 Legs
深蹲 40kg 12 12 30kg 11 11 
跑步 5km 15 20 180bpm 5`

export const movementToPart = new Map<string, string>(
  [...movementDefinitions.entries()].map(([category, definition]) => {
    return definition.movements.map((movement) => [movement, category] as [string, string])
  }).reduce((a, b) => a.concat(b), []))