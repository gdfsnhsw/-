const $ = new Env('联合开卡');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
$.CryptoJS = $.isNode() ? require('crypto-js') : CryptoJS;
$.helpCodes = [];
$.useInfo = {};
let cookiesArr = [];
$.appkey = `51B59BB805903DA4CE513D29EC448375`;
$.shareId = "88C6D65D0A826315870D0ABB8747E32DDE46F3879B1B2A4DB5F847D595ECFC7D444964BAA6654E6A6B1B7A78C3FC98905FC8FFF43FE734E7BC3DB412BC1E1375DDDA672BF446E2FCC0D1D6B4E52826D1"
if ($.isNode()) {
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    })
    if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
    cookiesArr = [
        $.getdata("CookieJD"),
        $.getdata("CookieJD2"),
        ...$.toObj($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
    if (!cookiesArr[0]) {
        $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
        return;
    }
    for (let i = 0; i < cookiesArr.length; i++) {
        $.index = i + 1;
        $.cookie = cookiesArr[i];
        $.isLogin = true;
        $.nickName = '';
        await TotalBean();
        $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
        console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
        if (!$.isLogin) {
            $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
            if ($.isNode()) {
                await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
            }
            continue
        }
        await main();
        await $.wait(2000);
    }
})().catch((e) => {$.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')}).finally(() => {$.done();});

async function main() {
    $.token = '';
    await getToken();
    if($.token){
        console.log(`Token:${$.token}`);
    }else {
        console.log(`获取Token失败`);
        return;
    }
    await $.wait(500);
    $.thisNick = $.shareId;
    $.firstThisNick = $.shareId
    await takePostRequest('setMixNick');
    await $.wait(500);
    if($.index == 1){
        $.firstThisNick = $.thisNick
    }
    await takePostRequest('missionInviteList');
    await $.wait(500);
    await takePostRequest('loadUniteOpenCard');
    await $.wait(500);
    await takePostRequest('shopList');
    await $.wait(500);
    await takePostRequest('uniteOpenCardStats');
    await $.wait(500);
    console.log("开始关注")
    await takePostRequest('followShop');
    await $.wait(500);
    console.log("开始抽奖")
    await takePostRequest('draw');
    await $.wait(500);
    console.log("开始添加购物车")
    await takePostRequest('addCart');
    await $.wait(500);
    console.log("开始入会")

    for(let cardList1Element of $.shopList){
        console.log(cardList1Element.shopTitle)
        if(cardList1Element.open){
            console.log("已开卡，跳过")
            continue
        }
        $.shopid = cardList1Element.userId
        await join($.shopid)
        await $.wait(1000)
        await takePostRequest('loadUniteOpenCard');
        await $.wait(500);
        await takePostRequest('uniteOpenCardStats');
        await $.wait(500);
    }
    await takePostRequest('missionInviteList');
}

function getshopactivityId(venderId) {
    return new Promise(resolve => {
        $.get(shopactivityId(`${venderId}`), async (err, resp, data) => {
            try {
                data = JSON.parse(data);
                if(data.success == true){
                    // console.log($.toStr(data.result))
                    // console.log(`入会:${data.result.shopMemberCardInfo.venderCardName || ''}`)
                    $.shopactivityId = data.result.interestsRuleList && data.result.interestsRuleList[0] && data.result.interestsRuleList[0].interestsInfo && data.result.interestsRuleList[0].interestsInfo.activityId || ''
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function shopactivityId(functionId) {
    return {
        url: `https://api.m.jd.com/client.action?appid=jd_shop_member&functionId=getShopOpenCardInfo&body=%7B%22venderId%22%3A%22${functionId}%22%2C%22channel%22%3A401%7D&client=H5&clientVersion=9.2.0&uuid=88888`,
        headers: {
            'Content-Type': 'text/plain; Charset=UTF-8',
            'Origin': 'https://api.m.jd.com',
            'Host': 'api.m.jd.com',
            'accept': '*/*',
            "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
            'content-type': 'application/x-www-form-urlencoded',
            'Referer': `https://shopmember.m.jd.com/shopcard/?venderId=${functionId}&shopId=${functionId}&venderType=5&channel=401&returnUrl=https://lzdz1-isv.isvjcloud.com/dingzhi/dz/openCard/activity/1760960?activityId=${$.activityId}&shareUuid=${$.shareUuid}`,
            'Cookie': $.cookie
        }
    }
}

function join(venderId) {
    return new Promise(async resolve => {
        $.shopactivityId = ''
        await $.wait(1000)
        await getshopactivityId(venderId)
        $.get(ruhui(`${venderId}`), async (err, resp, data) => {
            try {
                // console.log(data)
                data = JSON.parse(data);
                if(data.success == true){
                    $.log(data.message)
                    if(data.result && data.result.giftInfo){
                        for(let i of data.result.giftInfo.giftList){
                            console.log(`入会获得:${i.discountString}${i.prizeName}${i.secondLineDesc}`)
                        }
                    }
                }else if(data.success == false){
                    $.log(data.message)
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data);
            }
        })
    })
}
function ruhui(functionId) {
    let activityId = ``
    if($.shopactivityId) activityId = `,"activityId":${$.shopactivityId}`
    return {
        url: `https://api.m.jd.com/client.action?appid=jd_shop_member&functionId=bindWithVender&body={"venderId":"${functionId}","shopId":"${functionId}","bindByVerifyCodeFlag":1,"registerExtend":{},"writeChildFlag":0${activityId},"channel":401}&client=H5&clientVersion=9.2.0&uuid=88888`,
        headers: {
            'Content-Type': 'text/plain; Charset=UTF-8',
            'Origin': 'https://api.m.jd.com',
            'Host': 'api.m.jd.com',
            'accept': '*/*',
            "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
            'content-type': 'application/x-www-form-urlencoded',
            'Referer': `https://shopmember.m.jd.com/shopcard/?venderId=${functionId}&shopId=${functionId}&venderType=5&channel=401&returnUrl=https://lzdz1-isv.isvjcloud.com/dingzhi/dz/openCard/activity/1760960?activityId=${$.activityId}&shareUuid=${$.shareUuid}`,
            'Cookie': $.cookie
        }
    }
}

async function takePostRequest(type){
    let url = '';
    let body = ``;
    switch (type) {
        case 'setMixNick':
            url = `https://jinggengjcq-isv.isvjcloud.com/dm/front/openCard/${type}?mix_nick=6CB3172A4762A65C3D74CA7129532122DEE2E15182F512F317EFF6ED1AE9DE2C49336DE54E26AA8F2834B248E6398CB7A755DF4FDAE585EC3E1ABE26F3DD3CFFC956D12974FF00A045D8E31A84FE84C18A8357DE96A1F617B8AC4D64BC24B689`;
            body =  {"strTMMixNick":$.token,"source":"01","method":"/openCard/setMixNick","userId":"10299171","buyerNick":"6CB3172A4762A65C3D74CA7129532122DEE2E15182F512F317EFF6ED1AE9DE2C49336DE54E26AA8F2834B248E6398CB7A755DF4FDAE585EC3E1ABE26F3DD3CFFC956D12974FF00A045D8E31A84FE84C18A8357DE96A1F617B8AC4D64BC24B689"};
            break;
        case 'loadUniteOpenCard':
            url = `https://jinggengjcq-isv.isvjcloud.com/dm/front/openCard/loadUniteOpenCard?mix_nick=${$.thisNick}`;
            body =  {"inviteNick":$.firstThisNick,"shopId":$.shopid,"actId":"c2a69b3596a948d8b8028b9_820","method":"/openCard/loadUniteOpenCard","userId":"10299171","buyerNick":$.thisNick};
            break;
        case 'shopList':
            url = `https://jinggengjcq-isv.isvjcloud.com/dm/front/openCard/shopList?mix_nick=${$.thisNick}`;
            body =  {"actId":"c2a69b3596a948d8b8028b9_820","method":"/openCard/shopList","userId":"10299171","buyerNick":$.thisNick};
            break
        case 'uniteOpenCardStats':
            url = `https://jinggengjcq-isv.isvjcloud.com/dm/front/openCard/uniteOpenCardStats?mix_nick=${$.thisNick}`;
            body =  {"actId":"c2a69b3596a948d8b8028b9_820","missionType":"pv","pushWay":"1","method":"/openCard/uniteOpenCardStats","userId":"10299171","buyerNick":$.thisNick};
            break
        case 'followShop':
            url = `https://jinggengjcq-isv.isvjcloud.com/dm/front/openCard/followShop?mix_nick=${$.thisNick}`;
            body =  {"actId":"c2a69b3596a948d8b8028b9_820","missionType":"collectShop","method":"/openCard/followShop","userId":"10299171","buyerNick":$.thisNick};
            break
        case 'draw':
            url = `https://jinggengjcq-isv.isvjcloud.com/dm/front/openCard/draw?mix_nick=${$.thisNick}`;
            body =  {"actId":"c2a69b3596a948d8b8028b9_820","method":"/openCard/draw","userId":"10299171","buyerNick":$.thisNick};
            break
        case 'addCart':
            url = `https://jinggengjcq-isv.isvjcloud.com/dm/front/openCard/addCart?mix_nick=${$.thisNick}`;
            body =  {"actId":"c2a69b3596a948d8b8028b9_820","missionType":"addCart","method":"/openCard/addCart","userId":"10299171","buyerNick":$.thisNick};
            break
        case 'missionInviteList':
            url = `https://jinggengjcq-isv.isvjcloud.com/dm/front/openCard/missionInviteList?mix_nick=${$.thisNick}`;
            body =  {"actId":"c2a69b3596a948d8b8028b9_820","pageNo":"1","pageSize":"2000","method":"/openCard/missionInviteList","userId":"10299171","buyerNick":$.thisNick};
            break
        default:
            console.log(`错误${type}`);
    }
    let myRequest = getPostRequest(url,body);
    return new Promise(async resolve => {
        $.post(myRequest, (err, resp, data) => {
            try {
                dealReturn(type, data);
            } catch (e) {
                console.log(data);
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function dealReturn(type, data) {
    data = JSON.parse(data);
    switch (type) {
        case 'setMixNick':
            if(data.success && data.errorCode === '200' && data.data && data.data.status && data.data.status === 200){
                $.thisNick = data.data.data.msg;
                console.log("邀请码为：" + $.thisNick)
            }else{
                console.log(JSON.stringify(data));
            }
            break;
        case 'loadUniteOpenCard':
            //TODO
            break
        case 'shopList':
            if(data.success && data.errorCode === '200' && data.data && data.data.status && data.data.status === 200){
                $.shopList = data.data.data
            }
            break
        case 'followShop':
            if(data.success && data.errorCode === '200' && data.data && data.data.status && data.data.status === 200){
                console.log(data.data.data.msg)
            }
            break
        case 'draw':
            if(data.success && data.errorCode === '200' && data.data && data.data.status && data.data.status === 200){
                console.log("抽奖获得："+data.data.data.msg)
            }
            break
        case 'addCart':
            if(data.success && data.errorCode === '200' && data.data && data.data.status && data.data.status === 200){
                console.log(data.data.data.msg)
            }
            break
        case 'missionInviteList':
            if(data.success && data.errorCode === '200' && data.data && data.data.status && data.data.status === 200){
                //TODO
            }
            break
        default:
            console.log(JSON.stringify(data));
    }
}

function getPostRequest(url,body) {
    let signInfo = getSign(body);
    body = `{"jsonRpc":"2.0","params":{"commonParameter":{"appkey":"${$.appkey}","m":"POST","sign":"${signInfo.sign}","timestamp":${signInfo.timeStamp},"userId":"10299171"},"admJson":${JSON.stringify(body)}}}`;
    const headers = {
        'X-Requested-With' : `XMLHttpRequest`,
        'Connection' : `keep-alive`,
        'Accept-Encoding' : `gzip, deflate, br`,
        'Content-Type' : `application/json; charset=utf-8`,
        'Origin' : `https://jinggengjcq-isv.isvjcloud.com`,
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
        "Cookie": $.cookie,
        'Host' : `jinggengjcq-isv.isvjcloud.com`,
        'Referer' : `https://jinggengjcq-isv.isvjcloud.com/fronth5/?lng=113.259853&lat=23.175500&sid=197da03af8c3969e66a304060c05052w&un_area=19_1601_50258_50374`,
        'Accept-Language' : `zh-cn`,
        'Accept' : `application/json`
    };

    return  {url: url, method: `POST`, headers: headers, body: body};
}


async function getToken() {
    return new Promise(async (resolve) => {
        let options = {
            url: `https://api.m.jd.com/client.action?functionId=isvObfuscator&clientVersion=10.0.4&build=88641&client=android&d_brand=OPPO&d_model=PCAM00&osVersion=10&screen=2208*1080&partner=oppo&oaid=&openudid=7049442d7e41523&eid=eidAfb0d81231cs3I4yd3GgLRjqcx9qFEcJEmyOMn1BwD8wvLt%2FpM7ENipVIQXuRiDyQ0FYw2aud9%20AhtGqo1Zhp0TsLEgoKZvAWkaXhApgim9hlEyRB&sdkVersion=29&lang=zh_CN&uuid=7049442d7e415232&aid=7049442d7e415232&area=4_48201_54794_0&networkType=4g&wifiBssid=unknown&uts=0f31TVRjBSsqndu4%2FjgUPz6uymy50MQJs2X%2FHz8dwQrKfrmFvPGJYcIhgT3KrbJ2slvZoaufp78QzL4RqQVUgaKH%2Fq7EntlwV7J5l6acE2Wlj2%2Bu6Thwe90cWmtV80fH0yhpOV%2FhYIwvD5N6W1zo3LCVXTcuOw%2BARC%2F6K3bndzn3KzMw%2FpkYzhE2JcXeXiD44r%2BkUMawpn%2Bk7XqSVytdBg%3D%3D&uemps=0-0&st=1624988916642&sign=6a25b389996897b263c70516fc3c71e1&sv=122`,
            body: `body=%7B%22id%22%3A%22%22%2C%22url%22%3A%22https%3A%2F%2Fjinggengjcq-isv.isvjcloud.com%2Fpaoku%2Findex.html%3Fsid%3D75b413510cb227103e928769818a74ew%26un_area%3D4_48201_54794_0%22%7D&`,
            headers: {
                "Host": "api.m.jd.com",
                "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
                "Cookie": $.cookie,
            }
        }
        $.post(options, async (err, resp, data) => {
            try {
                const reust = JSON.parse(data);
                if(reust.errcode === 0){
                    $.token = reust.token;
                }else {
                    $.log(data)
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve();
            }
        });
    });
}

function getSign(t) {
    var e = Date.now()
        , i = '0282266f9a794112a0ab4ab6c78f8a09'
        , o = $.appkey
        , s = JSON.stringify(t)
        , c = encodeURIComponent(s)
        , r = new RegExp("'","g")
        , d = new RegExp("~","g");
    c = (c = c.replace(r, "%27")).replace(d, "%7E");
    var h = i + "admjson" + c + "appkey" + o + "m" + t.method + "timestamp" + e + i;
    return {sign: $.CryptoJS.MD5(h.toLowerCase()), timeStamp: e}
}

function TotalBean() {
    return new Promise(async resolve => {
        const options = {
            url: "https://wq.jd.com/user_new/info/GetJDUserInfoUnion?sceneval=2",
            headers: {
                Host: "wq.jd.com",
                Accept: "*/*",
                Connection: "keep-alive",
                Cookie: $.cookie,
                "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
                "Accept-Language": "zh-cn",
                "Referer": "https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&",
                "Accept-Encoding": "gzip, deflate, br"
            }
        }
        $.get(options, (err, resp, data) => {
            try {
                if (err) {
                    $.logErr(err)
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        if (data['retcode'] === 1001) {
                            $.isLogin = false; //cookie过期
                            return;
                        }
                        if (data['retcode'] === 0 && data.data && data.data.hasOwnProperty("userInfo")) {
                            $.nickName = data.data.userInfo.baseInfo.nickname;
                        }
                    } else {
                        console.log('京东服务器返回空数据');
                    }
                }
            } catch (e) {
                $.logErr(e)
            } finally {
                resolve();
            }
        })
    })
}
// prettier-ignore
function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
