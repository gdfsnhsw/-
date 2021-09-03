from mitmproxy import ctx
import requests, re, json, os


# 所有发出的请求数据包都会被这个方法所处理
# 所谓的处理，我们这里只是打印一下一些项；当然可以修改这些项的值直接给这些项赋值即可
# 实例化输出类
info = ctx.log.info

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


def request(flow):
	# 获取请求对象
	request = flow.request

	if flow.request.url.find(f"functionId=genToken") != -1:
		# 打印请求的url
		info("请求的url为："+request.url)
		cookies = dict(request.cookies)
		# 打印cookie头
		if cookies:
			wskey=cookies['wskey']
			pt_pin=cookies['pin']
			pt_pin_key = pt_pin.replace("%", "_")
			pt_pin_key = pt_pin.replace("-", "_")
			pt_pin_key = "_" + pt_pin_key
			info("wskey为："+wskey)
			info("pt_pin为："+pt_pin)
			info("pt_pin_key为："+pt_pin_key)
			#加载bot配置
			path_list = os.path.realpath(__file__).split('/')[1:]
			env = '/' + '/'.join(path_list[:-2])
			if os.path.isfile('/ql/config/cookie.sh') or os.path.isfile(f'{env}/config/cookie.sh'):  # 青龙
				if not os.path.isfile(f'{env}/config/cookie.sh'):  # 青龙容器内
					env = '/ql'
			bot = f'{env}/config/bot.json'
			with open(bot, 'r', encoding='utf-8') as botSet:
				bot = json.load(botSet)
			#添加wskey到配置
			with open(f"{env}/config/config.sh", 'r', encoding='utf-8') as f1:
				configs = f1.read()
				if configs.find(f"export " + pt_pin_key + "=") != -1:
					configs = re.sub(f'{pt_pin_key}=(\"|\').*(\"|\')', f'{pt_pin_key}="pin={pt_pin};wskey={wskey};"',
									 configs)
					msg = "替换wskey成功,pt_pin为："+pt_pin+",wskey为：" + wskey
				else:
					configs = configs + f'export {pt_pin_key}="pin={pt_pin};wskey={wskey};"'
					msg = "添加wskey成功,pt_pin为：" + pt_pin + ",wskey为：" + wskey
				with open(f"{env}/config/config.sh", 'w', encoding='utf-8') as f2:
					f2.write(configs)

			try:
				tgNofity(bot['user_id'], bot['bot_token'], msg)
			except:
				None