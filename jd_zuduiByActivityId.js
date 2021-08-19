const $ = new Env('组队分豆');
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let UA = require('./USER_AGENTS.js').USER_AGENT;
const notify = $.isNode() ? require('./sendNotify') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
    cookie = '';
if ($.isNode()) {
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    })
    if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
    cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}

let activityUrl = "https://lzkjdz-isv.isvjcloud.com/wxTeam/activity2/2920625?activityId=56fa76e74a80452b91f496d49451e7e3&signUuid=2c8f90cfa12e47d983aa33b7f9267db6&shareuserid4minipg=wL1GFYiFmVU3KttngoTUgGwklxRrP5C78lmKjh9Mn4avAmNuF4i+OHS9NlRdtagP&shopid=151148"
let activityId = ""
let venderId = ""
let sid = ""
let sidUuid=""
if(process.env.ZUDUI_ACTIVITY_URL1){
    activityUrl = process.env.ZUDUI_ACTIVITY_URL1
    console.log("配置的activityUrl为：" + activityUrl)
}

!(async () => {
    if (!cookiesArr[0]) {
        $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {
            "open-url": "https://bean.m.jd.com/"
        });
        return;
    }
    $.taskList = []
    $.needDoTask = []
    $.venderIds = new Map()
    $.signIds = new Map()
    $.firstSecretPin = ""

    for (let i = 0; i < cookiesArr.length; i++) {
        if(i > 0){
            break
        }
        cookie = cookiesArr[i];
        if (cookie) {
            $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
            $.index = i + 1;
            $.isLogin = true;
            $.nickName = '';
            if (!$.isLogin) {
                $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
                    "open-url": "https://bean.m.jd.com/bean/signIndex.action"
                });
                if ($.isNode()) {
                    await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
                }
                continue
            }

            activityId = activityUrl.substring(activityUrl.indexOf("activityId=") + "activityId=".length)
            activityId = activityId.substring(0,activityId.indexOf("&") == -1 ? activityId.length : activityId.indexOf("&"))

            venderId = activityUrl.substring(activityUrl.indexOf("shopid=") + "shopid=".length)
            venderId = venderId.substring(0,venderId.indexOf("&") == -1 ? venderId.length : venderId.indexOf("&"))

            $.signId = activityUrl.substring(activityUrl.indexOf("signUuid=") + "signUuid=".length)
            $.signId = $.signId.substring(0,$.signId.indexOf("&") == -1 ? $.signId.length : $.signId.indexOf("&"))

            console.log("activityId:",activityId)
            console.log("signId:",$.signId)
            console.log("shopid:",venderId)

            $.isvObfuscatorToken = ""
            await getIsvObfuscatorToken();

            $.LZ_TOKEN_KEY = "";
            $.LZ_TOKEN_VALUE = "";
            await accessActivity();

            $.lz_jdpin_token = ""
            $.secretPin = ""
            await getMyPing()

            await $.wait(1000)

            if (!$.secretPin) {
                $.log("黑号!")
                await $.wait(5000)
                continue
            }

            if($.index == 1){
                console.log("firstSecretPin:" + $.secretPin)
                $.firstSecretPin = $.secretPin
            }

            if($.index == 1){
                if(!sid){
                    await shopInfo("wxTeam");
                }else {
                    venderId = sid
                }
                if(!venderId){
                    await shopInfo("pool");
                }

                if(!sidUuid){
                    await getSignId("wxTeam");
                    if(!sidUuid){
                        await getSignId("pool");
                    }
                    $.signIds.set(activityId,$.signId)
                }else{
                    $.signIds.set(activityId,sidUuid)
                }
                await saveCaptain();
            }
        }
    }
    console.log(`\n******开始助力*********\n`);
    for (let i = 0; i < cookiesArr.length; i++) {
        cookie = cookiesArr[i];
        if (cookie) {
            $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
            $.index = i + 1;
            $.isLogin = true;
            $.nickName = '';

            console.log(`\n\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);

            $.LZ_TOKEN_KEY = "";
            $.LZ_TOKEN_VALUE = "";
            await accessActivity();

            $.isvObfuscatorToken = ""
            await getIsvObfuscatorToken();

            await getSimpleActInfoVo();

            $.lz_jdpin_token = ""
            $.AUTH_C_USER = ""
            $.secretPin = ""
            await getMyPing()

            await $.wait(1000)

            if (!$.secretPin) {
                $.log("黑号!")
                await $.wait(5000)
                continue
            }

            $.signId = $.signIds.get(activityId)
            if(!$.signId || $.signId == ""){
                console.log("sigin为空，跳过")
                continue
            }

            console.log("signUuid为：" + $.signId)
            console.log("venderId为：" + venderId)

            await accessLogWithAD();
            // await activityContent(item);

            await getActMemberInfo();
            console.log("开始加入队伍")
            await saveMember();
        }
    }
})()
    .catch((e) => $.logErr(e))
    .finally(() => $.done())

function saveCaptain() {

    return new Promise(resolve => {
        let options = {
            url: `https://lzkjdz-isv.isvjcloud.com/wxTeam/saveCaptain`,
            body: `activityId=${activityId}&pin=${encodeURIComponent($.secretPin)}&pinImg=http://storage.360buyimg.com/i.imageUpload/6a645f3437633463333562316434363231353937323838313433353232_mid.jpg`,
            headers: {
                'Accept':'application/json, text/javascript, */*; q=0.01',
                'User-Agent': `Mozilla/5.0 (Linux; U; Android 8.0.0; zh-cn; Mi Note 2 Build/OPR1.170623.032) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/61.0.3163.128 Mobile Safari/537.36 XiaoMi/MiuiBrowser/10.1.1`,
                'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With':'XMLHttpRequest',
                'Host':'lzkjdz-isv.isvjd.com',
                'Origin':'https://lzkjdz-isv.isvjd.com',
                'Referer':`https://lzkjdz-isv.isvjcloud.com/wxTeam/activity2/4207179?activityId=${activityId}&signUuid=${sidUuid}&shareuserid4minipg=${$.secretPin}&shopid=${$.shopid}`,
                'Cookie': `LZ_TOKEN_KEY=${$.LZ_TOKEN_KEY}; LZ_TOKEN_VALUE=${$.LZ_TOKEN_VALUE};lz_wq_auth_token=${$.isvObfuscatorToken}`,
            }
        }
        $.post(options, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    data = JSON.parse(data);
                    if(!data.result){
                        console.log(data.errorMessage)
                        return
                    }
                    if(data && data.data && data.data.signUuid){
                        console.log("重置signUuid为：" + data.data.signUuid+"，原signUuid为：" + $.signUuid)
                        $.signUuid = data.data.signUuid
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data.data);
            }
        })
    })
}

function saveMember(item) {
    return new Promise(resolve => {
        let options = {
            url: `https://lzkjdz-isv.isvjcloud.com/wxTeam/saveMember`,
            body: `activityId=${activityId}&pin=${encodeURIComponent($.secretPin)}&signUuid=${$.signId}&pinImg=${encodeURIComponent("http://storage.360buyimg.com/i.imageUpload/6a645f3437633463333562316434363231353937323838313433353232_mid.jpg")}`,
            headers: {
                'Accept':'application/json, text/javascript, */*; q=0.01',
                'User-Agent': `Mozilla/5.0 (Linux; U; Android 8.0.0; zh-cn; Mi Note 2 Build/OPR1.170623.032) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/61.0.3163.128 Mobile Safari/537.36 XiaoMi/MiuiBrowser/10.1.1`,
                'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With':'XMLHttpRequest',
                'Host':'lzkjdz-isv.isvjd.com',
                'Origin':'https://lzkjdz-isv.isvjd.com',
                'Referer':`https://lzkjdz-isv.isvjcloud.com/wxTeam/activity2/941462?activityId=${activityId}&signUuid=${$.signId}&shareuserid4minipg=${encodeURIComponent($.firstSecretPin)}&shopid=${venderId}`,
                'Cookie': `LZ_TOKEN_KEY=${$.LZ_TOKEN_KEY}; LZ_TOKEN_VALUE=${$.LZ_TOKEN_VALUE};AUTH_C_USER=${$.AUTH_C_USER};lz_jdpin_token=${$.lz_jdpin_token};`,
            }
        }
        $.post(options, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    data = JSON.parse(data);
                    if(data){
                        console.log("加入队伍信息：",data.errorMessage)
                    }
                    if(data && data.data && data.data.length > 0){
                        console.log("加入队伍成功")
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data.data);
            }
        })
    })
}

function accessActivity() {
    return new Promise(resolve => {
        let options = {
            url: `https://lzkjdz-isv.isvjcloud.com/wxTeam/activity2/2920625?activityId=${activityId}`,
            headers: {
                'User-Agent': `Mozilla/5.0 (Linux; U; Android 8.0.0; zh-cn; Mi Note 2 Build/OPR1.170623.032) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/61.0.3163.128 Mobile Safari/537.36 XiaoMi/MiuiBrowser/10.1.1`,
                'Cookie': `${cookie};IsvToken=${$.isvObfuscatorToken}`,
                'Host':'lzkjdz-isv.isvjcloud.com'
            }
        }
        $.get(options, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if(resp.statusCode == 200){
                        let cookies = resp.headers['set-cookie']
                        console.log("cookies",cookies)
                        $.LZ_TOKEN_KEY = cookies[0].substring(cookies[0].indexOf("=") + 1, cookies[0].indexOf(";"))
                        $.LZ_TOKEN_VALUE = cookies[1].substring(cookies[1].indexOf("=") + 1, cookies[1].indexOf(";"))

                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data.data);
            }
        })
    })
}

function accessLogWithAD(item) {
    return new Promise(resolve => {
        let pageUrl = `https://lzkjdz-isv.isvjcloud.com/wxTeam/activity2/1206424?activityId=${activityId}&signUuid=${$.signId}`
        let options = {
            url: `https://lzkjdz-isv.isvjcloud.com/common/accessLogWithAD`,
            body: `activityId=${activityId}&pin=${encodeURIComponent($.secretPin)}&subType=app&code=46&venderId=${venderId}&pageUrl=${encodeURIComponent(pageUrl)}&shareuserid4minipg=${$.firstSecretPin}&shopid=${venderId}`,
            headers: {
                'Accept':'application/json, text/javascript, */*; q=0.01',
                'User-Agent': `Mozilla/5.0 (Linux; U; Android 8.0.0; zh-cn; Mi Note 2 Build/OPR1.170623.032) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/61.0.3163.128 Mobile Safari/537.36 XiaoMi/MiuiBrowser/10.1.1`,
                'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With':'XMLHttpRequest',
                'Host':'lzkjdz-isv.isvjd.com',
                'Origin':'https://lzkjdz-isv.isvjd.com',
                'Referer':`https://lzkjdz-isv.isvjcloud.com/wxTeam/activity2/1206424?activityId=${activityId}&signUuid=${$.signId}&shareuserid4minipg=${$.firstSecretPin}&shopid=${venderId}`,
                'Cookie': `LZ_TOKEN_KEY=${$.LZ_TOKEN_KEY}; LZ_TOKEN_VALUE=${$.LZ_TOKEN_VALUE};AUTH_C_USER=${$.AUTH_C_USER};lz_jdpin_token=${$.lz_jdpin_token};lz_wq_auth_token=${$.isvObfuscatorToken}`,
            }
        }
        $.post(options, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if(resp.statusCode == 200){
                        let cookies = resp.headers['set-cookie']
                        $.LZ_TOKEN_KEY = cookies[0].substring(cookies[0].indexOf("=") + 1, cookies[0].indexOf(";"))
                        $.LZ_TOKEN_VALUE = cookies[1].substring(cookies[1].indexOf("=") + 1, cookies[1].indexOf(";"))

                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data.data);
            }
        })
    })
}

function shopInfo(type) {
    return new Promise(resolve => {
        let options = {
            url: `https://lzkjdz-isv.isvjcloud.com/${type}/shopInfo`,
            body: `activityId=${activityId}`,
            headers: {
                'Accept':'application/json, text/javascript, */*; q=0.01',
                'User-Agent': `Mozilla/5.0 (Linux; U; Android 8.0.0; zh-cn; Mi Note 2 Build/OPR1.170623.032) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/61.0.3163.128 Mobile Safari/537.36 XiaoMi/MiuiBrowser/10.1.1`,
                'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With':'XMLHttpRequest',
                'Host':'lzkjdz-isv.isvjd.com',
                'Origin':'https://lzkjdz-isv.isvjd.com',
                'Referer':`https://lzkjdz-isv.isvjcloud.com/wxTeam/activity2/941462?activityId=${activityId}&signUuid=${$.signId}&shareuserid4minipg=${encodeURIComponent($.firstSecretPin)}`,
                'Cookie': `LZ_TOKEN_KEY=${$.LZ_TOKEN_KEY}; LZ_TOKEN_VALUE=${$.LZ_TOKEN_VALUE};AUTH_C_USER=${$.AUTH_C_USER};lz_jdpin_token=${$.lz_jdpin_token};lz_wq_auth_token=${$.isvObfuscatorToken}`,
            }
        }
        $.post(options, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    data = JSON.parse(data);
                    if(data && data.data && data.data.sid){
                        venderId = data.data.sid
                        if(venderId && resp.statusCode == 200){
                            let cookies = resp.headers['set-cookie']
                            $.LZ_TOKEN_KEY = cookies[0].substring(cookies[0].indexOf("=") + 1, cookies[0].indexOf(";"))
                            $.LZ_TOKEN_VALUE = cookies[1].substring(cookies[1].indexOf("=") + 1, cookies[1].indexOf(";"))

                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data.data);
            }
        })
    })
}

function getActMemberInfo(item) {
    return new Promise(resolve => {
        let options = {
            url: `https://lzkjdz-isv.isvjcloud.com/wxCommonInfo/getActMemberInfo`,
            body: `activityId=${activityId}&pin=${encodeURIComponent($.secretPin)}&venderId=${venderId}`,
            headers: {
                'Accept':'application/json, text/javascript, */*; q=0.01',
                'User-Agent': `Mozilla/5.0 (Linux; U; Android 8.0.0; zh-cn; Mi Note 2 Build/OPR1.170623.032) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/61.0.3163.128 Mobile Safari/537.36 XiaoMi/MiuiBrowser/10.1.1`,
                'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With':'XMLHttpRequest',
                'Host':'lzkjdz-isv.isvjd.com',
                'Origin':'https://lzkjdz-isv.isvjd.com',
                'Referer':`https://lzkjdz-isv.isvjcloud.com/wxTeam/activity2/941462?activityId=${activityId}&signUuid=${$.signId}&shareuserid4minipg=${encodeURIComponent($.firstSecretPin)}&shopid=${venderId}`,
                'Cookie': `LZ_TOKEN_KEY=${$.LZ_TOKEN_KEY}; LZ_TOKEN_VALUE=${$.LZ_TOKEN_VALUE};AUTH_C_USER=${$.AUTH_C_USER};lz_jdpin_token=${$.lz_jdpin_token};lz_wq_auth_token=${$.isvObfuscatorToken}`,
            }
        }
        $.post(options, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if(resp.statusCode == 200){
                        let cookies = resp.headers['set-cookie']
                        $.LZ_TOKEN_KEY = cookies[0].substring(cookies[0].indexOf("=") + 1, cookies[0].indexOf(";"))
                        $.LZ_TOKEN_VALUE = cookies[1].substring(cookies[1].indexOf("=") + 1, cookies[1].indexOf(";"))

                    }
                    data = JSON.parse(data);
                    if(data && data.data){
                        //TODO
                        console.log("")

                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data.data);
            }
        })
    })
}

function getSignId(type) {
    return new Promise(resolve => {
        let options = {
            url: `https://lzkjdz-isv.isvjcloud.com/${type}/activityContent`,
            body: `activityId=${activityId}&pin=${encodeURIComponent($.secretPin)}&signUuid=${$.signId}`,
            headers: {
                'Accept':'application/json, text/javascript, */*; q=0.01',
                'User-Agent': `Mozilla/5.0 (Linux; U; Android 8.0.0; zh-cn; Mi Note 2 Build/OPR1.170623.032) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/61.0.3163.128 Mobile Safari/537.36 XiaoMi/MiuiBrowser/10.1.1`,
                'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With':'XMLHttpRequest',
                'Host':'lzkjdz-isv.isvjd.com',
                'Origin':'https://lzkjdz-isv.isvjd.com',
                'Referer':`https://lzkjdz-isv.isvjcloud.com/wxTeam/activity2/941462?activityId=${activityId}&signUuid=${$.signId}&shareuserid4minipg=${encodeURIComponent($.firstSecretPin)}&shopid=${venderId}`,
                'Cookie': `LZ_TOKEN_KEY=${$.LZ_TOKEN_KEY}; LZ_TOKEN_VALUE=${$.LZ_TOKEN_VALUE};lz_wq_auth_token=${$.isvObfuscatorToken}`,
            }
        }
        $.post(options, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    data = JSON.parse(data);
                    if(!data.result && data.errorMessage){
                        console.log(data.errorMessage)
                        return
                    }
                    if(data && data.data && data.data.signUuid){
                        $.signId = data.data.signUuid
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data.data);
            }
        })
    })
}

function getSimpleActInfoVo() {
    return new Promise(resolve => {
        let options = {
            url: `https://lzkjdz-isv.isvjcloud.com/customer/getSimpleActInfoVo`,
            body: `activityId=${activityId}`,
            headers: {
                'Accept':'application/json, text/javascript, */*; q=0.01',
                'User-Agent': `Mozilla/5.0 (Linux; U; Android 8.0.0; zh-cn; Mi Note 2 Build/OPR1.170623.032) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/61.0.3163.128 Mobile Safari/537.36 XiaoMi/MiuiBrowser/10.1.1`,
                'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With':'XMLHttpRequest',
                'Host':'lzkjdz-isv.isvjd.com',
                'Origin':'https://lzkjdz-isv.isvjd.com',
                'Referer':`https://lzkjdz-isv.isvjcloud.com/wxTeam/activity2/941462?activityId=${activityId}&signUuid=${$.signId}&shareuserid4minipg=${encodeURIComponent($.firstSecretPin)}&shopid=${venderId}`,
                'Cookie': `LZ_TOKEN_KEY=${$.LZ_TOKEN_KEY}; LZ_TOKEN_VALUE=${$.LZ_TOKEN_VALUE};lz_wq_auth_token=${$.isvObfuscatorToken};`,
            }
        }
        $.post(options, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if(resp.statusCode == 200){
                        let cookies = resp.headers['set-cookie']
                        $.LZ_TOKEN_KEY = cookies[0].substring(cookies[0].indexOf("=") + 1, cookies[0].indexOf(";"))
                        $.LZ_TOKEN_VALUE = cookies[1].substring(cookies[1].indexOf("=") + 1, cookies[1].indexOf(";"))

                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data.data);
            }
        })
    })
}

function getMyPing() {
    return new Promise(resolve => {
        let options = {
            url: `https://lzkjdz-isv.isvjd.com/customer/getMyPing`,
            body: `userId=599119&token=${$.isvObfuscatorToken}&fromType=APP`,
            headers: {
                'Accept':'application/json, text/javascript, */*; q=0.01',
                'User-Agent': `Mozilla/5.0 (Linux; U; Android 8.0.0; zh-cn; Mi Note 2 Build/OPR1.170623.032) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/61.0.3163.128 Mobile Safari/537.36 XiaoMi/MiuiBrowser/10.1.1`,
                'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With':'XMLHttpRequest',
                'Host':'lzkjdz-isv.isvjd.com',
                'Origin':'https://lzkjdz-isv.isvjd.com',
                'Referer':'https://lzkjdz-isv.isvjd.com/wxAssemblePage/activity/?activityId=67dfd244aacb438893a73a03785a48c7',
                'Cookie': `LZ_TOKEN_KEY=${$.LZ_TOKEN_KEY}; LZ_TOKEN_VALUE=${$.LZ_TOKEN_VALUE};lz_wq_auth_token=${$.isvObfuscatorToken};`,
            }
        }
        $.post(options, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if(resp.statusCode == 200){
                        let cookies = resp.headers['set-cookie']
                        if(cookies[2]){
                            $.LZ_TOKEN_KEY = cookies[0].substring(cookies[0].indexOf("=") + 1, cookies[0].indexOf(";"))
                            $.LZ_TOKEN_VALUE = cookies[1].substring(cookies[1].indexOf("=") + 1, cookies[1].indexOf(";"))
                            $.AUTH_C_USER = cookies[2].substring(cookies[2].indexOf("=") + 1, cookies[2].indexOf(";"))
                            $.lz_jdpin_token = cookies[3].substring(cookies[3].indexOf("=") + 1, cookies[3].indexOf(";"))
                        }
                    }
                    data = JSON.parse(data);
                    $.secretPin = data.data.secretPin
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data.data);
            }
        })
    })
}

function getIsvObfuscatorToken() {
    return new Promise(resolve => {
        $.post({
            url: `https://api.m.jd.com/client.action?functionId=isvObfuscator&area=19_1601_50258_50374&body=%7B%22url%22%3A%22https%3A%5C/%5C/lzkjdz-isv.isvjcloud.com%22%2C%22id%22%3A%22%22%7D&build=167741&client=apple&clientVersion=10.0.8&d_brand=apple&d_model=iPhone13%2C2&eid=eidI2ad5812337s3ghGuVeflROmNL7t9SyzhxIIRr8y39ehVQQzh3oXWc/QdZtuYpoU84EZvJqBkJ%2BWEUsc7iuc80hh3Y5nnWIpS4d3eVHSbXWGspkRV&isBackground=N&joycious=100&lang=zh_CN&networkType=3g&networklibtype=JDNetworkBaseAF&openudid=753d213009c85f60f8ce9df3a678389ffa3fb1c5&osVersion=14.7&partner=apple&rfs=0000&scope=11&screen=1170%2A2532&sign=2ffec555b43aad6c6463a59e6c6171be&st=1627614815813&sv=110&uemps=0-0&uts=0f31TVRjBStY4dJWmgbcW8p0brUbXrZeoPCj0W437gnaYlBn4xmhsA4SI6O1KP%2Bjy8ofgHABHMZEb884H1fvzolH4z%2BqsI5NgKKljgs8iMmxPuBc9EiSzSIb/2Nvf8QPLPCnJDgvjjZ3RMgrfBQasXg8AYpNrVCvUNhXVXFz3GSSC6EQIRlil7ZW45YN60Mu3JbKwlXFJXLeSIvplU/nXw%3D%3D&uuid=hjudwgohxzVu96krv/T6Hg%3D%3D&wifiBssid=unknown`,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; U; Android 8.0.0; zh-cn; Mi Note 2 Build/OPR1.170623.032) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/61.0.3163.128 Mobile Safari/537.36 XiaoMi/MiuiBrowser/10.1.1',
                'Content-Type':'application/x-www-form-urlencoded',
                'Host':'api.m.jd.com',
                'Referer':'',
                'Cookie': cookie,
            }
        }, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    data = JSON.parse(data);
                    if(data && data.code == 0){
                        $.isvObfuscatorToken = data.token
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data.token);
            }
        })
    })
}

function getCommonInfoToken() {
    return new Promise(resolve => {
        let options = {
            "url": `https://lzkjdz-isv.isvjd.com/wxAssemblePage/activity/?activityId=67dfd244aacb438893a73a03785a48c7`,
            "headers": {
                "Host": "lzkjdz-isv.isvjd.com",
                "Cookie": cookie,
                "Connection": "keep-alive",
                "Accept": "application/json, text/plain, */*",
                "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
                "Accept-Language": "zh-cn",
                "Referer": "https://lzkj-isv.isvjd.com/",
                "Accept-Encoding": "gzip, deflate, br",
            }
        };
        $.get(options, async (err, resp, data) => {
            try {
                if(resp.statusCode == 200){
                    let cookies = resp.headers['set-cookie']
                    $.LZ_TOKEN_KEY = cookies[0].substring(cookies[0].indexOf("=") + 1, cookies[0].indexOf(";"))
                    $.LZ_TOKEN_VALUE = cookies[1].substring(cookies[1].indexOf("=") + 1, cookies[1].indexOf(";"))

                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data);
            }
        })
    })
}

function jsonParse(str) {
    if (typeof str == "string") {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.log(e);
            $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
            return [];
        }
    }
}
// prettier-ignore
function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}


