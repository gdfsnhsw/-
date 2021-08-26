const $ = new Env('组队瓜分京豆');
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';

let UA = require('./USER_AGENTS.js')['USER_AGENT'];
const notify = $['isNode']() ? require('./sendNotify') : '';
let cookiesArr = [],
    cookie = '';
if ($.isNode()) {
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    })
    if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
    };
} else {
    cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}
!(async () => {
    if (!cookiesArr[0]) {
        $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {
            "open-url": "https://bean.m.jd.com/"
        });
        return;
    }
    $.inviter = '4oSXfUlJ1qzTqmn3/gy2c9A1Drq3za4lh6LFLfledF1cdSiqMbCx5edEEaL3RnCSkdK3rLBQpEQH9V4tdrrh0w==';
    $.DQCK = '4oSXfUlJ1qzTqmn3/gy2c9A1Drq3za4lh6LFLfledF1cdSiqMbCx5edEEaL3RnCSkdK3rLBQpEQH9V4tdrrh0w==';
    $.inviterNick = 'jd_69a61c2bc2102';

    for (let i = 0; i < cookiesArr.length; i++) {
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
            try {
                await main();
            } catch (e) {
                $.logErr(e, '执行异常！')
                if ($.index === 1) {
                    $.log('亲先检查CK1，或者与作者取得联系！');
                    break;
                }
            }
            if (($.index == 1) && $.myPingData) {
                $.inviter = $.myPingData.secretPin;
                $.DQCK = $.myPingData.secretPin;
                $.inviterNick = $.UserName;
            }
        }
    }
})().catch(e => $.logErr(e)).finally(() => $.done());

async function main() {
    console.log('\n******开始【京东账号' + $.index + '】' + ($.nickName || $.UserName) + '*********\n');
    getUA()
    $.LZ_TOKEN_KEY = "";
    $.LZ_TOKEN_VALUE = "";
    await getHtml();
    await getToken();
    $.myPingData = ''
    await getSystemConfig()
    await getSimpleActInfoVo()
    $.myPingData = await getMyPing();
    if ($.myPingData === "" || $.myPingData === '400001' || !$.myPingData || !$.myPingData.secretPin) {
        $.log("获取活动信息失败！")
        return
    }
    let activityInfos = await getActivityInfo();
    let inviteRecord = await getInviteRecord();
    // let isInvited = await getIsInvited();
    await adLog();
    let acceptInvite = await getAcceptInvite();
    for (let activityInfo of activityInfos.shopUrl) {
        $.log('入会 ' + activityInfo);
        await join(activityInfo.substring(activityInfo.indexOf("shopId=") + "shopId=".length));
    }
    await join2();
    await getOpenCardAllStatuesNew();
}

function getUA() {
    $.UA = `jdapp;iPhone;10.0.10;14.3;${randomString(40)};network/wifi;model/iPhone12,1;addressid/4199175193;appBuild/167741;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`
}

function randomString(e) {
    e = e || 32;
    let t = "abcdef0123456789", a = t.length, n = "";
    for (i = 0; i < e; i++)
        n += t.charAt(Math.floor(Math.random() * a));
    return n
}

function getActivityInfo() {
    return new Promise(resolve => {
        let body = 'activityId=054c727844b4400ebbb459e41db7a883';
        $.post(taskPostUrl('/microDz/invite/activity/wx/getActivityInfo', body, 'https://cjhydz-isv.isvjcloud.com/microDz/invite/activity/wx/getActivityInfo'),
            async (err, resp, data) => {
                try {
                    if (err) {
                        console.log($.name + ' API请求失败，请检查网路重试');
                    } else {
                        data = JSON.parse(data);
                    }
                } catch (e) {
                    data = {
                        'data': {
                            'nowScore': 0x32
                        }
                    };
                    $.logErr(e, resp);
                } finally {
                    resolve(data.data);
                }
            });
    });
}

function getInviteRecord() {
    return new Promise(resolve => {
        let body = 'activityId=054c727844b4400ebbb459e41db7a883&inviter=' + encodeURIComponent($.myPingData.secretPin) + '&pageNo=1&pageSize=15&type=0';
        let options = {
            'url': 'https://cjhydz-isv.isvjcloud.com/microDz/invite/activity/wx/inviteRecord',
            'body': body,
            'headers': {
                'Host': 'cjhydz-isv.isvjcloud.com',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept-Language': 'zh-cn',
                'Accept-Encoding': 'gzip, deflate, br',
                'Content-Type': 'application/x-www-form-urlencoded; Charset=UTF-8',
                'Origin': 'https://cjhydz-isv.isvjcloud.com',
                'Connection': 'keep-alive',
                'Referer': 'https://cjhydz-isv.isvjcloud.com/microDz/invite/activity/wx/inviteRecord',
                'User-Agent': $.UA,
                'Cookie': cookie + ' LZ_TOKEN_KEY=' + $.LZ_TOKEN_KEY + '; LZ_TOKEN_VALUE=' + $.LZ_TOKEN_VALUE + '; AUTH_C_USER=' + $.myPingData.secretPin + '; ' + $.lz_jdpin_token
            }
        }
        $.post(options,async (err, resp, data) => {
                try {
                    if (err) {
                        console.log($.name + ' API请求失败，请检查网路重试');
                    } else {
                        data = JSON.parse(data);
                    }
                } catch (e) {
                    $.logErr(e, resp);
                } finally {
                    resolve()
                }
            });
    });
}

function getIsInvited() {
    return new Promise(resolve => {
        let body = 'activityId=054c727844b4400ebbb459e41db7a883&pin=' + encodeURIComponent($.myPingData.secretPin);
        $.post(taskPostUrl('/microDz/invite/activity/wx/isInvited', body, 'https://cjhydz-isv.isvjcloud.com/microDz/invite/activity/wx/isInvited'),
            async (err, resp, data) => {
                try {
                    if (err) {
                        console.log($.name + ' API请求失败，请检查网路重试');
                    } else {
                        data = JSON.parse(data);
                    }
                } catch (e) {
                    $.logErr(e, resp);
                } finally {
                    resolve(data.data);
                }
            });
    });
}

function getAcceptInvite() {
    return new Promise(resolve => {
        let body = 'activityId=054c727844b4400ebbb459e41db7a883&inviter=' + encodeURIComponent($.DQCK) + '&inviterImg=http%3A%2F%2Fstorage.360buyimg.com%2Fi.imageUpload%2F6a645f73495a76594b617266594d5731363237363637373836333031_mid.jpg&inviterNick=' + encodeURIComponent($.inviterNick) + '&invitee=' + encodeURIComponent($.myPingData.secretPin) + '&inviteeImg=https%3A%2F%2Fimg10.360buyimg.com%2Fimgzone%2Fjfs%2Ft1%2F21383%2F2%2F6633%2F3879%2F5c5138d8E0967ccf2%2F91da57c5e2166005.jpg&inviteeNick=' + $.UserName;
        let options = {
            'url': 'https://cjhydz-isv.isvjcloud.com/microDz/invite/activity/wx/acceptInvite',
            'body': body,
            'headers': {
                'Host': 'cjhydz-isv.isvjcloud.com',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept-Language': 'zh-cn',
                'Accept-Encoding': 'gzip, deflate, br',
                'Content-Type': 'application/x-www-form-urlencoded; Charset=UTF-8',
                'Origin': 'https://cjhydz-isv.isvjcloud.com',
                'Connection': 'keep-alive',
                'Referer': 'https://cjhydz-isv.isvjcloud.com/microDz/invite/activity/wx/acceptInvite',
                'User-Agent': $.UA,
                'Cookie': cookie + ' LZ_TOKEN_KEY=' + $.LZ_TOKEN_KEY + '; LZ_TOKEN_VALUE=' + $.LZ_TOKEN_VALUE + '; AUTH_C_USER=' + $.myPingData.secretPin + '; ' + $.lz_jdpin_token
            }
        }
        $.post(options,async (err, resp, data) => {
                try {
                    if (err) {
                        console.log($.name + ' API请求失败，请检查网路重试');
                    } else {
                        data = JSON.parse(data);
                        if (data.errorMessage) {
                            $.log('' + data.errorMessage);
                        }
                    }
                } catch (e) {
                    $.logErr(e, resp);
                } finally {
                    resolve();
                }
            });
    });
}

function getOpenCardAllStatuesNew() {
    return new Promise(resolve => {
        let body = 'activityId=054c727844b4400ebbb459e41db7a883&pin=' + encodeURIComponent($.myPingData.secretPin) + '&isInvited=1';
        $.post(taskPostUrl('/microDz/invite/activity/wx/getOpenCardAllStatuesNew', body, 'https://cjhydz-isv.isvjcloud.com/microDz/invite/activity/wx/getOpenCardAllStatuesNew'),
            async (err, resp, data) => {
                try {
                    if (err) {
                        console.log($.name + ' API请求失败，请检查网路重试');
                    } else {
                        data = JSON.parse(data);
                        $.log('isCanJoin: ' + data.data['isCanJoin']);
                    }
                } catch (e) {
                    $.logErr(e, resp);
                } finally {
                    resolve(data.data);
                }
            });
    });
}

function join(venderId) {
    return new Promise(resolve => {
        $.get(ruhui('' + venderId), async (err, resp, data) => {
            try {
                data = data['match'](/(\{().+\})/)[0x1];
                data = JSON.parse(data);
                $.log(data['message']);
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve(data);
            }
        });
    });
}

function ruhui(venderId) {
    return {
        'url': 'https://api.m.jd.com/client.action?appid=jd_shop_member&functionId=bindWithVender&body={"venderId":"' + venderId + '\",\"shopId\":\"' + venderId + '","bindByVerifyCodeFlag":1,"registerExtend":{"v_sex":"未知","v_name":"大品牌","v_birthday":"2021-07-23"},"writeChildFlag":0,"activityId":1454199,"channel":401}&client=H5&clientVersion=9.2.0&uuid=88888&jsonp=jsonp_1627049995456_46808',
        'headers': {
            'Content-Type': 'text/plain; Charset=UTF-8',
            'Origin': 'https://api.m.jd.com',
            'Host': 'api.m.jd.com',
            'accept': '*/*',
            'User-Agent': $.UA,
            'content-type': 'application/x-www-form-urlencoded',
            'Referer': 'https://shopmember.m.jd.com/shopcard/?venderId=' + venderId + '&shopId=' + venderId + '&venderType=1&channel=102&returnUrl=https%%3A%%2F%%2Flzdz1-isv.isvjcloud.com%%2Fdingzhi%%2Fdz%%2FopenCard%%2Factivity%%2F7376465%%3FactivityId%%3Dd91d932b9a3d42b9ab77dd1d5e783839%%26shareUuid%%3Ded1873cb52384a6ab42671eb6aac841d',
            'Cookie': cookie
        }
    };
}

function join2() {
    return new Promise(resolve => {
        $.get(ruhui2(), async (err, resp, data) => {
            try {
                data = data['match'](/(\{().+\})/)[0x1];
                data = JSON.parse(data);
                $.log(data.message);
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve(data);
            }
        });
    });
}

function ruhui2() {
    return {
        'url': 'https://api.m.jd.com/client.action?appid=jd_shop_member&functionId=bindWithVender&body=%7B%22venderId%22%3A%2210314962%22%2C%22shopId%22%3A%2210175519%22%2C%22bindByVerifyCodeFlag%22%3A1%2C%22registerExtend%22%3A%7B%22v_sex%22%3A%22%E6%9C%AA%E7%9F%A5%22%2C%22v_birthday%22%3A%221996-11-11%22%2C%22v_name%22%3A%22yyy%22%7D%2C%22writeChildFlag%22%3A0%2C%22channel%22%3A8802%7D&client=H5&clientVersion=9.2.0&uuid=88888&jsonp=jsonp_1628345987749_66821',
        'headers': {
            'Content-Type': 'text/plain; Charset=UTF-8',
            'Origin': 'https://api.m.jd.com',
            'Host': 'api.m.jd.com',
            'accept': '*/*',
            'User-Agent': $.UA,
            'content-type': 'application/x-www-form-urlencoded',
            'Referer': 'https://shopmember.m.jd.com/shopcard/?venderId=10314962&shopId=10175519&channel=8802&returnUrl=https://cjhydz-isv.isvjcloud.com/microDz/invite/activity/wx/view/index/4438790?activityId=054c727844b4400ebbb459e41db7a883&inviter=' + $.DQCK + '&inviterImg=http://storage.360buyimg.com/i.imageUpload/6a645f3639613631633262633231303231363238313235383234363133_mid.jpg&inviterNickName=Tsukasa%E9%B1%BC%E8%9B%8B&shareuserid4minipg=DQCK%2FksVMxxhAtP2wbQfI9A1Drq3za4lh6LFLfledF1cdSiqMbCx5edEEaL3RnCSkdK3rLBQpEQH9V4tdrrh0w%3D%3D&shopid=599119&lng=113.388014&lat=22.510994&sid=09fdc8e908526b5538a4ad4a265f40dw&un_area=19_1657_52093_0',
            'Cookie': cookie
        }
    };
}

function getWxCommonInfoToken() {
    return new Promise(_0x4bff7a => {
        $.post({
            'url': 'https://lzdz1-isv.isvjcloud.com/wxCommonInfo/token',
            'headers': {
                'User-Agent': 'Mozilla/5.0 (Linux; U; Android 8.0.0; zh-cn; Mi Note 2 Build/OPR1.170623.032) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/61.0.3163.128 Mobile Safari/537.36 XiaoMi/MiuiBrowser/10.1.1',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Host': 'lzdz1-isv.isvjcloud.com',
                'Origin': 'https://lzdz1-isv.isvjcloud.com',
                'Referer': 'https://lzdz1-isv.isvjcloud.com/wxCommonInfo/token'
            }
        }, async (err, resp, data) => {
            try {
                if (err) {
                    console.log('' + JSON.stringify(err));
                    console.log($.name + ' API请求失败，请检查网路重试');
                } else {
                    data = JSON.parse(data);
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve(data);
            }
        });
    });
}

function getToken() {
    return new Promise(resolve => {
        let body = 'adid=7B411CD9-D62C-425B-B083-9AFC49B94228&area=16_1332_42932_43102&body=%7B%22url%22%3A%22https%3A%5C/%5C/cjhydz-isv.isvjcloud.com%22%2C%22id%22%3A%22%22%7D&build=167541&client=apple&clientVersion=9.4.0&d_brand=apple&d_model=iPhone8%2C1&eid=eidId10b812191seBCFGmtbeTX2vXF3lbgDAVwQhSA8wKqj6OA9J4foPQm3UzRwrrLdO23B3E2wCUY/bODH01VnxiEnAUvoM6SiEnmP3IPqRuO%2By/%2BZo&isBackground=N&joycious=48&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&openudid=2f7578cb634065f9beae94d013f172e197d62283&osVersion=13.1.2&partner=apple&rfs=0000&scope=11&screen=750%2A1334&sign=60bde51b4b7f7ff6e1bc1f473ecf3d41&st=1613720203903&sv=110&uts=0f31TVRjBStG9NoZJdXLGd939Wv4AlsWNAeL1nxafUsZqiV4NLsVElz6AjC4L7tsnZ1loeT2A8Z5/KfI/YoJAUfJzTd8kCedfnLG522ydI0p40oi8hT2p2sNZiIIRYCfjIr7IAL%2BFkLsrWdSiPZP5QLptc8Cy4Od6/cdYidClR0NwPMd58K5J9narz78y9ocGe8uTfyBIoA9aCd/X3Muxw%3D%3D&uuid=hjudwgohxzVu96krv/T6Hg%3D%3D&wifiBssid=9cf90c586c4468e00678545b16176ed2';
        $.post({
                'url': 'https://api.m.jd.com/client.action?functionId=isvObfuscator',
                'body': body,
                'headers': {
                    'Accept': '*/*',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Accept-Language': 'zh-cn',
                    'Connection': 'keep-alive',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Host': 'api.m.jd.com',
                    'Cookie': cookie,
                    'User-Agent': $.UA
                }
            },
            async (err, resp, data) => {
                try {
                    if (err) {
                        console.log('' + JSON.stringify(err));
                        console.log($.name + ' 2 API请求失败，请检查网路重试');
                    } else {
                        data = JSON.parse(data);
                        if (data.code == 0 && data.token) {
                            $.isvObfuscatorToken = data.token;
                        } else {
                            console.log('异常2：' + JSON.stringify(data));
                        }
                    }
                } catch (e) {
                    $.logErr(e, resp);
                } finally {
                    resolve();
                }
            });
    });
}

function getMyPing() {
    return new Promise(resolve => {
        $.post({
            'url': 'https://cjhydz-isv.isvjcloud.com/customer/getMyPing',
            'body': 'userId=599119&token=' + $.isvObfuscatorToken + '&fromType=APP_pointRedeem',
            'headers': {
                'User-Agent': $.UA,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Host': 'cjhydz-isv.isvjcloud.com',
                'Referer': 'https://lzdz1-isv.isvjcloud.com/customer/getMyPing',
                'Cookie': 'LZ_TOKEN_KEY=' + $.LZ_TOKEN_KEY + '; LZ_TOKEN_VALUE=' + $.LZ_TOKEN_VALUE + ';'
            }
        }, async (err, resp, data) => {
            try {
                if (err) {
                    console.log('' + JSON.stringify(err));
                    console.log($.name + ' API请求失败，请检查网路重试');
                } else {
                    data = JSON.parse(data);
                    let setcookies = resp['headers']['set-cookie'] || resp['headers']['Set-Cookie'] || ''
                    let setcookie = ''
                    if (setcookies) {
                        if (typeof setcookies != 'object') {
                            setcookie = setcookies.split(',')
                        } else setcookie = setcookies
                        let lz_jdpin_token = setcookie.filter(row => row.indexOf("lz_jdpin_token") !== -1)[0]
                        $.lz_jdpin_token = ''
                        if (lz_jdpin_token && lz_jdpin_token.indexOf("lz_jdpin_token=") > -1) {
                            $.lz_jdpin_token = lz_jdpin_token.split(';') && (lz_jdpin_token.split(';')[0] + ';') || ''
                        }
                        let LZ_TOKEN_VALUE = setcookie.filter(row => row.indexOf("LZ_TOKEN_VALUE") !== -1)[0]
                        if (LZ_TOKEN_VALUE && LZ_TOKEN_VALUE.indexOf("LZ_TOKEN_VALUE=") > -1) {
                            $.LZ_TOKEN_VALUE = LZ_TOKEN_VALUE.split(';') && (LZ_TOKEN_VALUE.split(';')[0]) || ''
                            $.LZ_TOKEN_VALUE = $.LZ_TOKEN_VALUE.replace('LZ_TOKEN_VALUE=', '')
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve(data.data);
            }
        });
    });
}

function getHtml() {
    return new Promise(resolve => {
        $.get({
            'url': 'https://cjhydz-isv.isvjcloud.com/microDz/invite/activity/wx/view/index/4438790?activityId=054c727844b4400ebbb459e41db7a883&inviter=' + $.inviter + '&inviterImg=http://storage.360buyimg.com/i.imageUpload/6a645f3639613631633262633231303231363238313235383234363133_mid.jpg&inviterNickName=Tsukasa%E9%B1%BC%E8%9B%8B&shareuserid4minipg=DQCK%2FksVMxxhAtP2wbQfI9A1Drq3za4lh6LFLfledF1cdSiqMbCx5edEEaL3RnCSkdK3rLBQpEQH9V4tdrrh0w%3D%3D&shopid=599119&lng=113.388014&lat=22.510994&sid=09fdc8e908526b5538a4ad4a265f40dw&un_area=19_1657_52093_0',
            'headers': {
                'User-Agent': $.UA,
                'Host': 'cjhydz-isv.isvjcloud.com',
                'Referer': 'https://cjhydz-isv.isvjcloud.com/microDz/invite/activity/wx/view/index/4438790?activityId=054c727844b4400ebbb459e41db7a883&inviter=' + $.inviter + '&inviterImg=http://storage.360buyimg.com/i.imageUpload/6a645f3639613631633262633231303231363238313235383234363133_mid.jpg&inviterNickName=Tsukasa%E9%B1%BC%E8%9B%8B&shareuserid4minipg=DQCK%2FksVMxxhAtP2wbQfI9A1Drq3za4lh6LFLfledF1cdSiqMbCx5edEEaL3RnCSkdK3rLBQpEQH9V4tdrrh0w%3D%3D&shopid=599119&lng=113.388014&lat=22.510994&sid=09fdc8e908526b5538a4ad4a265f40dw&un_area=19_1657_52093_0'
            }
        }, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if (resp.statusCode == 200) {
                        let cookies = resp.headers['set-cookie']
                        $.LZ_TOKEN_KEY = cookies[0].substring(cookies[0].indexOf("=") + 1, cookies[0].indexOf(";"))
                        $.LZ_TOKEN_VALUE = cookies[1].substring(cookies[1].indexOf("=") + 1, cookies[1].indexOf(";"))
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        });
    });
}

function getSystemConfig() {
    return new Promise(resolve => {
        let options = {
            'url': 'https://cjhydz-isv.isvjcloud.com/wxCommonInfo/getSystemConfig',
            'body': 'activityId=054c727844b4400ebbb459e41db7a883',
            'headers': {
                'Host': 'cjhydz-isv.isvjcloud.com',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept-Language': 'zh-cn',
                'Accept-Encoding': 'gzip, deflate, br',
                'Content-Type': 'application/x-www-form-urlencoded; Charset=UTF-8',
                'Origin': 'https://cjhydz-isv.isvjcloud.com',
                'Connection': 'keep-alive',
                'Referer': 'https://cjhydz-isv.isvjcloud.com/microDz/invite/activity/wx/view/index',
                'User-Agent': $.UA,
                'Cookie': ' LZ_TOKEN_KEY=' + $.LZ_TOKEN_KEY + '; LZ_TOKEN_VALUE=' + $.LZ_TOKEN_VALUE
            }
        }
        $.post(options, async (err, resp, data) => {
            try {
                if (err) {
                    console.log('' + JSON.stringify(err));
                    console.log($.name + ' API请求失败，请检查网路重试');
                } else {
                    data = JSON.parse(data);
                    if (resp.status == 200) {
                        let cookies = resp.headers['set-cookie']
                        $.LZ_TOKEN_KEY = cookies[0].substring(cookies[0].indexOf("=") + 1, cookies[0].indexOf(";"))
                        $.LZ_TOKEN_VALUE = cookies[1].substring(cookies[1].indexOf("=") + 1, cookies[1].indexOf(";")).replace("==","")
                    }
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve(data);
            }
        });
    });
}

function getSimpleActInfoVo() {
    return new Promise(resolve => {
        let options = {
            'url': 'https://cjhydz-isv.isvjcloud.com/customer/getSimpleActInfoVo',
            'body': 'activityId=054c727844b4400ebbb459e41db7a883',
            'headers': {
                'Host': 'cjhydz-isv.isvjcloud.com',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept-Language': 'zh-cn',
                'Accept-Encoding': 'gzip, deflate, br',
                'Content-Type': 'application/x-www-form-urlencoded; Charset=UTF-8',
                'Origin': 'https://cjhydz-isv.isvjcloud.com',
                'Connection': 'keep-alive',
                'Referer': 'https://cjhydz-isv.isvjcloud.com/microDz/invite/activity/wx/view/index/2693797?activityId=054c727844b4400ebbb459e41db7a883',
                'User-Agent': $.UA,
                'Cookie': ' LZ_TOKEN_KEY=' + $.LZ_TOKEN_KEY + '; LZ_TOKEN_VALUE=' + $.LZ_TOKEN_VALUE
            }
        }
        $.post(options,async (err, resp, data) => {
                try {
                    if (err) {
                        console.log('' + JSON.stringify(err));
                        console.log($.name + ' API请求失败，请检查网路重试');
                    } else {
                        data = JSON.parse(data);
                    }
                } catch (e) {
                    $.logErr(e, resp);
                } finally {
                    resolve(data);
                }
            });
    });
}

function shopInfo() {
    return new Promise(_0x2d04f8 => {
        let body = 'activityId=054c727844b4400ebbb459e41db7a883';
        $.post({
            'url': 'https://lzdz1-isv.isvjcloud.com/dingzhi/shop/league/shopInfo',
            'body': body,
            'headers': {
                'Connection': 'Keep-Alive',
                'Content-Type': 'application/x-www-form-urlencoded; Charset=UTF-8',
                'Accept': '*/*',
                'Accept-Language': 'zh-cn',
                'Referer': 'https://lzdz1-isv.isvjcloud.com/dingzhi/shop/league/shopInfo',
                'User-Agent': $.UA,
                'Host': 'lzdz1-isv.isvjcloud.com',
                'Cookie': 'LZ_TOKEN_KEY=' + $.LZ_TOKEN_KEY + '; LZ_TOKEN_VALUE=' + $.LZ_TOKEN_VALUE + '; AUTH_C_USER=' + $.myPingData.secretPin + '; ' + $.lz_jdpin_token
            }
        }, async (err, resp, data) => {
            try {
                if (err) {
                    console.log($.name + ' API请求失败，请检查网路重试');
                } else {
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve(data);
            }
        });
    });
}

function index() {
    return new Promise(resolve => {
        let _0x15bbca = 'activityId=054c727844b4400ebbb459e41db7a883';
        $.get({
            'url': 'https://h5.m.jd.com/babelDiy/Zeus/2vQWcFpeGVxMqGFiUbGAM3CzqvJS/index.html?1',
            'headers': {
                'Connection': 'Keep-Alive',
                'Content-Type': 'application/x-www-form-urlencoded; Charset=UTF-8',
                'Accept': '*/*',
                'Accept-Language': 'zh-cn',
                'Referer': 'https://lzdz1-isv.isvjcloud.com/dingzhi/shop/league/shopInfo',
                'User-Agent': $.UA,
                'Host': 'h5.m.jd.com',
                'Cookie': 'LZ_TOKEN_KEY=' + $.LZ_TOKEN_KEY + '; LZ_TOKEN_VALUE=' + $.LZ_TOKEN_VALUE + '; AUTH_C_USER=' + $.myPingData.secretPin + '; ' + $.lz_jdpin_token
            }
        }, async (err, resp, data) => {
            try {
                if (err) {
                    console.log($.name + ' API请求失败，请检查网路重试');
                } else {
                    data = JSON.parse(data);
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve(data);
            }
        });
    });
}

function adLog() {
    return new Promise(resolve => {
        $.post({
            'url': 'https://cjhydz-isv.isvjcloud.com/common/accessLog',
            'body': 'venderId=0&code=99&pin=' + encodeURIComponent($.myPingData.secretPin) + '&activityId=054c727844b4400ebbb459e41db7a883&pageUrl=https%3A%2F%2Fcjhydz-isv.isvjcloud.com%2FmicroDz%2Finvite%2Factivity%2Fwx%2Fview%2Findex%2F2388747%3FactivityId%3D054c727844b4400ebbb459e41db7a883%26inviter%3Djzv2jbYRftpJUlB6E7%2Ff3%2FL7ldxmgdCpzmNX2HGi4eBuw30v%2FPoVBgxrRDHHbTlt%26inviterImg%3Dhttp%3A%2F%2Fstorage.360buyimg.com%2Fi.imageUpload%2F6a645f73495a76594b617266594d5731363237363637373836333031%5Fmid.jpg%26inviterNickName%3D%E4%B8%8A%E8%AF%BE%E6%97%A0%E8%81%8A%E5%90%97%26shareuserid4minipg%3D4oSXfUlJ1qzTqmn3%252Fgy2c9A1Drq3za4lh6LFLfledF1cdSiqMbCx5edEEaL3RnCSkdK3rLBQpEQH9V4tdrrh0w%253D%253D%26shopid%3D599119%26lng%3D0.000000%26lat%3D0.000000%26sid%3D5fa6c7778669e4865e2e7e7ba5ea098w%26un%5Farea%3D17%5F1458%5F1463%5F43894&subType=',
            'headers': {
                'User-Agent': 'Mozilla/5.0 (Linux; U; Android 8.0.0; zh-cn; Mi Note 2 Build/OPR1.170623.032) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/61.0.3163.128 Mobile Safari/537.36 XiaoMi/MiuiBrowser/10.1.1',
                'Host': 'cjhydz-isv.isvjcloud.com',
                'Content-Type': 'application/x-www-form-urlencoded; Charset=UTF-8',
                'Referer': 'https://cjhydz-isv.isvjcloud.com/common/accessLog',
                'Cookie': 'LZ_TOKEN_KEY=' + $.LZ_TOKEN_KEY + '; LZ_TOKEN_VALUE=' + $.LZ_TOKEN_VALUE + '; AUTH_C_USER=' + $.myPingData.secretPin + '; ' + $.lz_jdpin_token
            }
        }, async (err, resp, data) => {
            try {
                if (err) {
                    console.log('' + JSON.stringify(err));
                    console.log($.name + ' API请求失败，请检查网路重试');
                } else {
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve(data);
            }
        });
    });
}

function taskPostUrl(url, body, referer) {
    return {
        'url': 'https://cjhydz-isv.isvjcloud.com' + url,
        'body': body,
        'headers': {
            'Host': 'cjhydz-isv.isvjcloud.com',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'Accept-Language': 'zh-cn',
            'Accept-Encoding': 'gzip, deflate, br',
            'Content-Type': 'application/x-www-form-urlencoded; Charset=UTF-8',
            'Origin': 'https://cjhydz-isv.isvjcloud.com',
            'Connection': 'keep-alive',
            'Referer': referer ? referer : 'https://lzdz1-isv.isvjcloud.com/lzclient/dz/2021jan/eliminateGame/0713eliminate/?activityId=054c727844b4400ebbb459e41db7a883&shareUuid=' + $['shareUuid'] + '&adsource=&shareuserid4minipg=4oSXfUlJ1qzTqmn3%2Fgy2c9A1Drq3za4lh6LFLfledF1cdSiqMbCx5edEEaL3RnCSkdK3rLBQpEQH9V4tdrrh0w%3D%3D&shopid=0&lng=114.062541&lat=29.541254&sid=768a88cc4b9bd28cc8be56c2ae0d3e0w&un_area=4_48201_54794_0',
            'User-Agent': $.UA,
            'Cookie': cookie + ' LZ_TOKEN_KEY=' + $.LZ_TOKEN_KEY + '; LZ_TOKEN_VALUE=' + $.LZ_TOKEN_VALUE + ($.myPingData.secretPin ? '; AUTH_C_USER=' + $.myPingData.secretPin : "") + '; ' + $.lz_jdpin_token
        }
    };
};

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
function Env(t, e) {
    "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0);

    class s {
        constructor(t) {
            this.env = t
        }

        send(t, e = "GET") {
            t = "string" == typeof t ? {url: t} : t;
            let s = this.get;
            return "POST" === e && (s = this.post), new Promise((e, i) => {
                s.call(this, t, (t, s, r) => {
                    t ? i(t) : e(s)
                })
            })
        }

        get(t) {
            return this.send.call(this.env, t)
        }

        post(t) {
            return this.send.call(this.env, t, "POST")
        }
    }

    return new class {
        constructor(t, e) {
            this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`)
        }

        isNode() {
            return "undefined" != typeof module && !!module.exports
        }

        isQuanX() {
            return "undefined" != typeof $task
        }

        isSurge() {
            return "undefined" != typeof $httpClient && "undefined" == typeof $loon
        }

        isLoon() {
            return "undefined" != typeof $loon
        }

        toObj(t, e = null) {
            try {
                return JSON.parse(t)
            } catch {
                return e
            }
        }

        toStr(t, e = null) {
            try {
                return JSON.stringify(t)
            } catch {
                return e
            }
        }

        getjson(t, e) {
            let s = e;
            const i = this.getdata(t);
            if (i) try {
                s = JSON.parse(this.getdata(t))
            } catch {
            }
            return s
        }

        setjson(t, e) {
            try {
                return this.setdata(JSON.stringify(t), e)
            } catch {
                return !1
            }
        }

        getScript(t) {
            return new Promise(e => {
                this.get({url: t}, (t, s, i) => e(i))
            })
        }

        runScript(t, e) {
            return new Promise(s => {
                let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
                i = i ? i.replace(/\n/g, "").trim() : i;
                let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
                r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r;
                const [o, h] = i.split("@"), n = {
                    url: `http://${h}/v1/scripting/evaluate`,
                    body: {script_text: t, mock_type: "cron", timeout: r},
                    headers: {"X-Key": o, Accept: "*/*"}
                };
                this.post(n, (t, e, i) => s(i))
            }).catch(t => this.logErr(t))
        }

        loaddata() {
            if (!this.isNode()) return {};
            {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e);
                if (!s && !i) return {};
                {
                    const i = s ? t : e;
                    try {
                        return JSON.parse(this.fs.readFileSync(i))
                    } catch (t) {
                        return {}
                    }
                }
            }
        }

        writedata() {
            if (this.isNode()) {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data);
                s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r)
            }
        }

        lodash_get(t, e, s) {
            const i = e.replace(/\[(\d+)\]/g, ".$1").split(".");
            let r = t;
            for (const t of i) if (r = Object(r)[t], void 0 === r) return s;
            return r
        }

        lodash_set(t, e, s) {
            return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t)
        }

        getdata(t) {
            let e = this.getval(t);
            if (/^@/.test(t)) {
                const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : "";
                if (r) try {
                    const t = JSON.parse(r);
                    e = t ? this.lodash_get(t, i, "") : e
                } catch (t) {
                    e = ""
                }
            }
            return e
        }

        setdata(t, e) {
            let s = !1;
            if (/^@/.test(e)) {
                const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i),
                    h = i ? "null" === o ? null : o || "{}" : "{}";
                try {
                    const e = JSON.parse(h);
                    this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i)
                } catch (e) {
                    const o = {};
                    this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i)
                }
            } else s = this.setval(t, e);
            return s
        }

        getval(t) {
            return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null
        }

        setval(t, e) {
            return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null
        }

        initGotEnv(t) {
            this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))
        }

        get(t, e = (() => {
        })) {
            t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {"X-Surge-Skip-Scripting": !1})), $httpClient.get(t, (t, s, i) => {
                !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
            })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {hints: !1})), $task.fetch(t).then(t => {
                const {statusCode: s, statusCode: i, headers: r, body: o} = t;
                e(null, {status: s, statusCode: i, headers: r, body: o}, o)
            }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => {
                try {
                    if (t.headers["set-cookie"]) {
                        const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
                        s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar
                    }
                } catch (t) {
                    this.logErr(t)
                }
            }).then(t => {
                const {statusCode: s, statusCode: i, headers: r, body: o} = t;
                e(null, {status: s, statusCode: i, headers: r, body: o}, o)
            }, t => {
                const {message: s, response: i} = t;
                e(s, i, i && i.body)
            }))
        }

        post(t, e = (() => {
        })) {
            if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {"X-Surge-Skip-Scripting": !1})), $httpClient.post(t, (t, s, i) => {
                !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
            }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {hints: !1})), $task.fetch(t).then(t => {
                const {statusCode: s, statusCode: i, headers: r, body: o} = t;
                e(null, {status: s, statusCode: i, headers: r, body: o}, o)
            }, t => e(t)); else if (this.isNode()) {
                this.initGotEnv(t);
                const {url: s, ...i} = t;
                this.got.post(s, i).then(t => {
                    const {statusCode: s, statusCode: i, headers: r, body: o} = t;
                    e(null, {status: s, statusCode: i, headers: r, body: o}, o)
                }, t => {
                    const {message: s, response: i} = t;
                    e(s, i, i && i.body)
                })
            }
        }

        time(t, e = null) {
            const s = e ? new Date(e) : new Date;
            let i = {
                "M+": s.getMonth() + 1,
                "d+": s.getDate(),
                "H+": s.getHours(),
                "m+": s.getMinutes(),
                "s+": s.getSeconds(),
                "q+": Math.floor((s.getMonth() + 3) / 3),
                S: s.getMilliseconds()
            };
            /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length)));
            for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length)));
            return t
        }

        msg(e = t, s = "", i = "", r) {
            const o = t => {
                if (!t) return t;
                if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? {"open-url": t} : this.isSurge() ? {url: t} : void 0;
                if ("object" == typeof t) {
                    if (this.isLoon()) {
                        let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"];
                        return {openUrl: e, mediaUrl: s}
                    }
                    if (this.isQuanX()) {
                        let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl;
                        return {"open-url": e, "media-url": s}
                    }
                    if (this.isSurge()) {
                        let e = t.url || t.openUrl || t["open-url"];
                        return {url: e}
                    }
                }
            };
            if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) {
                let t = ["", "==============📣系统通知📣=============="];
                t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t)
            }
        }

        log(...t) {
            t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator))
        }

        logErr(t, e) {
            const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
            s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t)
        }

        wait(t) {
            return new Promise(e => setTimeout(e, t))
        }

        done(t = {}) {
            const e = (new Date).getTime(), s = (e - this.startTime) / 1e3;
            this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t)
        }
    }(t, e)
}


