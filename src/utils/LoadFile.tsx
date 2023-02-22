export function LoadTrainingRecords(fileName = "../record.txt") {
    return ``
}


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


export const movementToPart = new Map<string, string>();

movementDefinitions.map((definition) => {
    return definition.movements.map((movement) => [movement, definition.part])
}).reduce((a, b) => a.concat(b), []).forEach((pair) => {
    movementToPart.set(pair[0], pair[1]);
});