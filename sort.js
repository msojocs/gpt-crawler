const fs = require('fs')

const dirList = fs.readdirSync('.')
const resultDirList = dirList.filter(e=>e.startsWith('1'))
// const latestDir = resultDirList[resultDirList.length - 1]
// console.log(latestDir)
const latestDir = 'task/chat+gpt+4/result'
const resultList = fs.readdirSync(latestDir).filter(e => e.includes('page'))
console.log(resultList)
const list = []
for (const resultName of resultList) {
    const resultData = require(`./${latestDir}/${resultName}`)
    // console.log(resultData)
    const tokenList = resultData.map(e => ({
        token: e.token,
        type: e.gpt4 ? 'gpt4' : 'gpt3'
    }))
    list.push(...tokenList)

}
list.sort((a, b ) => {
    if (a.token > b.token) return 1
    if (a.token < b.token) return -1
    return 0
})
const uniqueArray = Array.from(new Set(list.map((item) => item.token))).map(
    (token) => {
        return list.find((item) => item.token === token);
    }
);
console.log(uniqueArray.map(e => `- token: ${e.token}\n  type: ${e.type}`).join('\n'))