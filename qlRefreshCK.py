import requests, re, json, os,random,uuid

signList = [{'uuid': 'tlfqkad4995a9r2l', 'st': 1630504207937, 'sv': '120', 'sign': '3acfb9084ab46fc2ad7089698f724c12'}, {'uuid': '9wv3dtgj4b9bqlaj', 'st': 1630504217523, 'sv': '120', 'sign': '3ca60d1d1932a407e49fc459da44b5d8'}, {'uuid': '8sp61sajtmrjtgep', 'st': 1630504248624, 'sv': '111', 'sign': 'efa5cfa8824f62dca0ea2de65b7dd125'}, {'uuid': 'ait94rb7em2b0rkc', 'st': 1630504282323, 'sv': '102', 'sign': '1a32e9429f991f19be9e25d1989f1b7e'}, {'uuid': 'jtpnhqoiduk3b5nv', 'st': 1630504302445, 'sv': '111', 'sign': '0e699ea61d36cab77f477ae5fd8bc82f'}, {'uuid': 'egwzdfcckd0f4m2j', 'st': 1630504351768, 'sv': '102', 'sign': '2027a503d9eeb14fbb8067cbbbf8e604'}, {'uuid': 'n2bb7ssvumkns59e', 'st': 1630504362054, 'sv': '102', 'sign': '596b37a93cc7d9ccc01d1c5330b3ccda'}, {'uuid': 'jtahcpqd3o8ko2vy', 'st': 1630504371396, 'sv': '102', 'sign': '00f27cc34ce13d6c3bec65419bf78039'}, {'uuid': 'jd416j5lxhuigfw5', 'st': 1630504380694, 'sv': '102', 'sign': '4e760a164c6cfe83baa929c990b5b5bb'}, {'uuid': 'bksk08lajww2xa8s', 'st': 1630504389311, 'sv': '120', 'sign': '85baea7837c633b335e0f190aac8c83f'}]
code = 0

def tgNofity(user_id, bot_token, text):
    TG_API_HOST = 'api.telegram.org'
    url = f'https://{TG_API_HOST}/bot{bot_token}/sendMessage'
    body = {
        "chat_id": user_id,
        "text": text,
        "disable_web_page_preview": True
    }
    headers = {
        "ontent-Type": "application/x-www-form-urlencoded"
    }
    try:
        r = requests.post(url, data=body, headers=headers)
        if r.ok:
            print("Telegram发送通知消息成功🎉。\n")
        elif r.status_code == '400':
            print("请主动给bot发送一条消息并检查接收用户ID是否正确。\n")
        elif r.status_code == '401':
            print("Telegram bot token 填写错误。\n")
    except Exception as error:
        print(f"telegram发送通知消息失败！！\n{error}")

def getToken(ws):
    signs = random.choice(signList)
    headers = {
        'cookie': ws,
        'User-Agent': 'okhttp/3.12.1;jdmall;android;version/10.1.2;build/89743;screen/1440x3007;os/11;network/wifi;',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'charset': 'UTF-8',
        'accept-encoding': 'br,gzip,deflate'
    }
    params = {
        'functionId': 'genToken',
        'clientVersion': '14.1.1',
        'client': 'apple',
        'lang': 'zh_CN',
        'uuid': signs['uuid'],
        'st': signs['st'],
        'sign': signs['sign'],
        'sv': signs['sv']
    }
    url = 'https://api.m.jd.com/client.action'
    data = 'body=%7B%22action%22%3A%22to%22%2C%22to%22%3A%22https%253A%252F%252Fplogin.m.jd.com%252Fcgi-bin%252Fm%252Fthirdapp_auth_page%253Ftoken%253D%2526client_type%253Dandroid%2526appid%253D879%2526appup_type%253D1%22%7D&'
    res = requests.post(url=url, params=params, headers=headers, data=data, verify=False)
    print(res.text)
    res_json = json.loads(res.text)
    totokenKey = res_json['tokenKey']
    return appjmp(totokenKey)

def genTokenPanda(wsCookie):
    url = "https://api.jds.codes/gentoken"
    print("准备请求Panda大佬sign接口:" + url)
    body = {"url": "https://home.m.jd.com/myJd/newhome.action"}
    headers = {
        "user-agent": "Mozilla/5.0 (Windows NT 6.3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
        "Content-Type":"application/json"
    }
    r = requests.post(url, headers=headers, data=json.dumps(body))
    r = json.loads(r.text)
    print("Panda大佬sign接口返回参数为：")
    print(r)
    data=r["data"]["sign"].split("&")
    jduuid = data[1]
    clientVersion = data[3]
    client = data[2]
    sign = data[4] + "&" + data[5] + "&" + data[6]
    url = "https://api.m.jd.com/client.action?functionId=genToken&%s&%s&%s&%s" % (clientVersion, client, jduuid, sign)
    headers = {
        "Host": 'api.m.jd.com',
        "Cookie": wsCookie,
        "accept": '*/*',
        "referer": '',
        'user-agent': "okhttp/3.12.1;jdmall;apple;version/9.4.0;build/88830;screen/1440x3007;os/11;network/wifi;" + str(
            uuid.uuid4()),
        'accept-language': 'zh-Hans-CN;q=1, en-CN;q=0.9',
        'content-type': 'application/x-www-form-urlencoded;',
    }
    print(headers)
    res = requests.post(url, headers=headers, data="body=%7B%22to%22%3A%20%22https%3A//home.m.jd.com/myJd/newhome.action%22%2C%20%22action%22%3A%20%22to%22%7D")
    print(res.text)
    res_json = json.loads(res.text)
    totokenKey = res_json['tokenKey']
    code = res_json['code']
    print("请求Panda大佬sign接口成功")
    return appjmp(totokenKey)

def appjmp(token):
    headers = {
        'User-Agent': 'jdapp;android;10.1.2;11;0393465333165363-5333430323261366;network/wifi;model/M2102K1C;addressid/938507929;aid/09d53a5653402b1f;oaid/2acbcab5bb3f0e68;osVer/30;appBuild/89743;partner/lc023;eufv/1;jdSupportDarkMode/0;Mozilla/5.0 (Linux; Android 11; M2102K1C Build/RKQ1.201112.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045714 Mobile Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    }
    params = {
        'tokenKey': token,
        'to': 'https://plogin.m.jd.com/cgi-bin/m/thirdapp_auth_page?token=AAEAIEijIw6wxF2s3bNKF0bmGsI8xfw6hkQT6Ui2QVP7z1Xg',
        'client_type': 'android',
        'appid': 879,
        'appup_type': 1,
    }
    url = 'https://un.m.jd.com/cgi-bin/app/appjmp'
    res = requests.get(url=url, headers=headers, params=params, verify=False, allow_redirects=False)
    res_set = res.cookies.get_dict()
    pt_key = 'pt_key=' + res_set['pt_key']
    pt_pin = 'pt_pin=' + res_set['pt_pin']
    ck = str(pt_key) + ';' + str(pt_pin) + ';'
    return ck

# 开始执行主程序
if __name__ == '__main__':
    JD_WSCK = []
    JD_WSCKOrigin = ""
    print("加载bot配置")
    path_list = os.path.realpath(__file__).split('/')[1:]
    env = '/' + '/'.join(path_list[:-2])
    if os.path.isfile('/ql/config/cookie.sh') or os.path.isfile(f'{env}/config/cookie.sh'):  # 青龙
        if not os.path.isfile(f'{env}/config/cookie.sh'):  # 青龙容器内
            env = '/ql'
    bot = f'{env}/config/bot.json'
    print("加载config文件配置")
    with open(bot, 'r', encoding='utf-8') as botSet:
        bot = json.load(botSet)
    with open(f"{env}/config/config.sh", 'r', encoding='utf-8') as f1:
        while True:
            line = f1.readline()
            if not line :
                break
            if line.find(f"export JD_WSCK=") != -1:
                JD_WSCKOrigin = line
                break
    #去掉export JD_WSCK=
    print("配置的JD_WSCK为：" + JD_WSCKOrigin)
    msg = ""
    if JD_WSCKOrigin:
        JD_WSCKOrigin = JD_WSCKOrigin.replace("export JD_WSCK=","")
        JD_WSCKArr = JD_WSCKOrigin.split('&')
        if JD_WSCKArr:
            for JDWSCKStr in JD_WSCKArr:
                #去掉$
                pt_pin = JDWSCKStr.replace("$","")
                pt_pin = pt_pin.replace("'","")
                pt_pin = pt_pin.replace("\n","")
                print("去掉$后的JD_WSCK为："+pt_pin)
                print("准备替换配置为："+ f"export {pt_pin}=")
                #循环配置文件，拿到对应的pt_pin和wskey
                with open(f"{env}/config/config.sh", 'r', encoding='utf-8') as f1:
                    while True:
                        line = f1.readline()
                        if not line:
                            break
                        print(f"准备开始找wskey配置 export {pt_pin}=")
                        if line.find(f"export {pt_pin}=") != -1:
                            #去掉export XXX=
                            print(f"找到wskey配置")
                            line = line.replace(f"export {pt_pin}=","")
                            line = line.replace("\n","")
                            if line and line != "":
                                JD_WSCK.append(line)
                                print("添加wskey:"+line)
                                break
        for ckStr in JD_WSCK:
            print("准备获取token的ck为：" + ckStr)
            ckStr = ckStr.replace('"','')
            try:
                ck = genTokenPanda(ckStr)
            except:
                code = 1
                if code != 0:
                    try:
                        print("请求Panda大佬sign接口失败，获取固定sign")
                        ck = getToken(ckStr)
                    except:
                        continue


            if ckStr and ckStr != "":
                print("ck为："+ck)
                if ck.find(f"pt_key=fake") != -1:
                    msg += f"wskey过期，wskye内容为：{ckStr}\n"
                else:
                    print("准备更新ck到后台")
                    msg += f"获取ck成功，准备更新到后台，ck为：{ck}\n"
                    # 更新ck到后台
                    rep = requests.get("http://127.0.0.1:8888/?" + ck)
                    print(rep.status_code)
                    msg += f"后台返回状态为：{rep.status_code}\n"
        try:
            tgNofity(bot['user_id'], bot['bot_token'], msg)
        except:
            None
