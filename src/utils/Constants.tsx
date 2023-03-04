interface ColorMap { [key: string]: { outColor: string, inColor: string } }

export const themes: ColorMap = {
    "Chest": {
        outColor: "#99ff00",
        inColor: "#ffff00",
    },
    "Legs": {
        outColor: "#ff8800",
        inColor: "#ff0000",
    },
    "Back": {
        outColor: "#0099ff",
        inColor: "#00ffff",
    },
    "General": {
        outColor: "#ff00ff",
        inColor: "#ff88ff",
    },
    "Shoulder": {
        outColor: "#ffff00",
        inColor: "#ffff88",
    },
}

export const oneday = 1000 * 60 * 60 * 24;
export const today = new Date();


export const movementDefinitions = [
    {
        part: "Shoulder", movements: [
            "FacePull",
            "侧平举",
            "推举"
        ]
    },
    {
        part: "Chest", movements: [
            "上斜卧推",
            "上斜",
            "卧推",
            "飞鸟",
            "哑铃飞鸟",
            "平板哑铃",
            "平板飞鸟"
        ]
    },
    {
        part: "Back", movements: [
            "下拉",
            "划船",
            "反手杠铃划船",
            "杠铃划船",
            "绳索划船"
        ]
    },
    {
        part: "Bicep", movements: [
            "哑铃弯举",
            "杠铃弯举",
            "弯举"
        ]
    },
    {
        part: "Tricep", movements: [
            "屈伸",
            "碎裂者"
        ]
    },
    {
        part: "Legs", movements: [
            "并脚蹲",
            "深蹲",
            "窄蹲",
            "硬拉"
        ]
    }
]

export const sampleRecordsRaw = `2023-02-06
卧推 40kg 12 12 11 11 
飞鸟 8kg 10 10 10 11
碎裂者 15kg  14 13 12 9
屈伸 15kg 13 12 11 10
FacePull 10kg 15 15 14 13 
侧平举 3kg 16 16 15 14

2023-02-07
反手杠铃划船 25kg 12 12 11 10
下拉 21.25kg 12 12 12 12
哑铃弯举 10kg 15 14 11 8
杠铃弯举 15kg 10 11 10 9
推举 10kg 12 12 12 11
侧平举 4kg 15 15 15 14

2023-02-10
卧推 45kg 12 12 10 9
飞鸟 8kg 10 10 10 10
碎裂者 15kg 15 15 13 10
屈伸 15kg 14 13 12 11
FacePull 12.5kg 15 13 13 12

2023-02-14
卧推 47.5kg 12 12 11 9
飞鸟 10kg 10 10 10 10
碎裂者 17.5kg 15 14 11 10
屈伸 15kg 15 14 12 11
FacePull 15kg 15 14 11 11

2023-02-15
深蹲 40kg 9 9 7 6
窄蹲 2.5kg 12 11 10 10

2023-02-16
反手杠铃划船 27.5kg 12 12 11 9
下拉 26.25kg 12 12 11 10
哑铃弯举 12.5kg 12 10 8 7
杠铃弯举 15kg 13 12 11 10
推举 15kg 13 12 12 10`

export const movementToPart = new Map<string, string>();

movementDefinitions.map((definition) => {
    return definition.movements.map((movement) => [movement, definition.part])
}).reduce((a, b) => a.concat(b), []).forEach((pair) => {
    movementToPart.set(pair[0], pair[1]);
});