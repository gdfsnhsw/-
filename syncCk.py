# coding:utf-8
import socket
import re
import requests
import json
import time
import datetime

HOST, PORT = '', 8888

listen_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
listen_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
listen_socket.bind((HOST, PORT))
listen_socket.listen(1)
print('Serving HTTP on port %s ...' % PORT)
ptReg = "pt_key=([^; ]+)(?=;?)"
pkReg = "pt_pin=([^; ]+)(?=;?)"

# authStr = 'C:/Users/xinhu/Desktop/fsdownload/auth.json'
# cookieDb = 'C:/Users/xinhu/Desktop/fsdownload/cookie.db'

authStr = '/ql/config/auth.json'
cookieDb = '/ql/db/cookie.db'

#拿到传递过来的ck
pt_key=""
pt_pin=""
while True:
    client_connection, client_address = listen_socket.accept()
    request = client_connection.recv(1024)
    reqDec = request.decode("utf-8")

    rr = re.compile(ptReg)
    pt_key=rr.search(reqDec)[0]

    rr = re.compile(pkReg)
    pt_pin = rr.search(reqDec)[0]

    print("获取到ck")
    print(pt_key)
    print(pt_pin)

    print("开始读取ck文件")
    #读取文件 判断是否用户存在
    f = open(cookieDb,'r',1024,'utf-8')
    line = f.readline()

    pt_keyE = ""
    pt_pinE = ""
    idE = ""

    isExit = False;
    idReg = '(?<=\"_id\":\")[a-z|A-Z|0-9]+(?=\")'

    while line:
        rr = re.compile(pkReg)
        if(rr.search(line)):
            pt_pinE = rr.search(line)[0]

            rr = re.compile(idReg)
            idE = rr.search(line)[0]

            if(pt_pinE == pt_pin):
                print(pt_pinE)
                print(pt_pin)
                isExit = True
                break;
        line = f.readline()
    f.close()

    #读取青龙token
    f = open(authStr, 'r', 1024, 'utf-8')
    lines = f.readlines()
    tokenStr = json.loads(lines[0])
    tokenStr = tokenStr['token']
    f.close()

    if(isExit):
        print("ck已存在，准备更新ck")
        t = time.time()
        # 请求更新ck
        url = 'http://127.0.0.1:5700/api/cookies?t=' + str(t)

        headers = {
            "Authorization": "Bearer " + tokenStr
        }

        data = {
            "_id": idE,
            "value": '' + pt_key + ';' + pt_pin + ';'
        }
        print(data)
        r = requests.put(url, data, headers=headers)

        http_response = """\
            HTTP/1.1 200 OK

            Ok
            """
        print(r)
        if (r.status_code == 200):
            print("更新cookie成功")
            http_response = """\
                        HTTP/1.1 200 OK

                        Ok
                        """
            client_connection.sendall(http_response.encode("utf-8"))
            client_connection.close()
        else:
            print("更新cookies失败")
            http_response = "HTTP/1.1 400 OK\r\n"
            http_response += "\r\n"  # header与body之间必须隔一行

            client_connection.sendall(http_response.encode("utf-8"))
            client_connection.close()
    else:
        print("ck不存在，新增ck")
        t = time.time()
        # 请求更新ck
        url = 'http://127.0.0.1:5700/api/cookies?t=' + str(t)

        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + tokenStr
        }

        data = '["' + pt_key + ';' + pt_pin + ';"]'
        print(data)
        r = requests.post(url, data, headers=headers)

        if (r.status_code == 200):
            print("添加cookie成功")
            http_response = "HTTP/1.1 200 OK\r\n"
            http_response += "\r\n"  # header与body之间必须隔一行
            client_connection.sendall(http_response.encode("utf-8"))
            client_connection.close()

        else:
            print("添加cookies失败")
            http_response = "HTTP/1.1 400 OK\r\n"
            http_response += "\r\n"  # header与body之间必须隔一行
            client_connection.sendall(http_response.encode("utf-8"))
            client_connection.close()

