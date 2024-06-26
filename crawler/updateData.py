import json
import re
import requests
import sys
from os import getenv

import urllib3
urllib3.disable_warnings()

baseURL = "https://timetable.nycu.edu.tw/"
Verbose = False
if sys.argv[-1] == 'Y':
    Verbose = True
    sys.argv.pop()

res = requests.get(baseURL+"?r=main/get_acysem", headers={'user-agent': 'Mozilla/5.0'}, verify=False)
if res.status_code != 200:
    print("Request acysem data error!!")
    exit(-1)
data = [x['T'] for x in res.json()]
if len(sys.argv) < 2:
    ysem: str = data[0]
else:
    ysem = ''
    sel = sys.argv[1]
    for x in data:
        if re.findall(sel, x):
            ysem = x
            break

if ysem == '':
    exit(-1)

Year = ysem[:-1]
Semester = ysem[-1]

print("URL: %s\nYear: %s\nSemester: %s\nVerbose: %s"%(baseURL, Year, Semester, Verbose))

data_type = []
reqData = {
    "acysem":str(Year)+str(Semester),
    "acysemend":str(Year)+str(Semester)
}
res = requests.post(baseURL+"?r=main/get_type",data = reqData,headers={'user-agent': 'Mozilla/5.0'},verify=False)
if res.status_code != 200:
    print("Request type data error!!")
    exit(-1)
data_type = [r["uid"] for r in json.loads(res.text)]
#print(res.text)

data_type_category = []
reqData = {
    "acysem":str(Year)+str(Semester),
    "acysemend":str(Year)+str(Semester),
    "ftype":""
}
for t in data_type:
    reqData["ftype"] = t
    res = requests.post(baseURL+"?r=main/get_category",data = reqData,headers={'user-agent': 'Mozilla/5.0'},verify=False)
    if res.status_code != 200:
        print("Request type %s data error!!"%t)
        continue
    #print(res.text)
    for c in json.loads(res.text):
        if len(c) <= 0:
            continue
        data_type_category.append((t,c))
#print(data_type_category)

data_type_category_college = []
reqData = {
    "acysem":str(Year)+str(Semester),
    "acysemend":str(Year)+str(Semester),
    "ftype":"",
    "fcategory":""
}
for tc in data_type_category:
    #print(tc)
    reqData["ftype"] = tc[0]
    reqData["fcategory"] = tc[1]
    res = requests.post(baseURL+"?r=main/get_college",data = reqData,headers={'user-agent': 'Mozilla/5.0'},verify=False)
    if res.status_code != 200:
        print("Request type %s category %s data error!!"%(tc[0],tc[1]))
        continue
    #print(res.text)
    data_type_category_college.append((tc[0],tc[1],"*"))
    for c in json.loads(res.text):
        if len(c) <= 0:
            continue
        data_type_category_college.append((tc[0],tc[1],c))
#print(data_type_category_college)

data_dep = []
reqData = {
    "acysem":str(Year)+str(Semester),
    "acysemend":str(Year)+str(Semester),
    "ftype":"",
    "fcategory":"",
    "fcollege":""
}
data_dep_name = {}
for tc in data_type_category_college:
    #print(tc)
    reqData["ftype"] = tc[0]
    reqData["fcategory"] = tc[1]
    reqData["fcollege"] = tc[2]
    res = requests.post(baseURL+"?r=main/get_dep",data = reqData,headers={'user-agent': 'Mozilla/5.0'},verify=False)
    if res.status_code != 200:
        print("Request type %s category %s dep %s data error!!"%(tc[0],tc[1],tc[2]))
        continue
    #print(res.text)
    get_dep_res = json.loads(res.text)
    for c in get_dep_res:
        if len(c) <= 0:
            continue
        data_dep.append(c)
        data_dep_name[c] = get_dep_res[c]
        #print(get_dep_res[c])
#print(data_dep)
#print(len(data_dep))
data_dep = list(set(data_dep))
#exit()

CourseData = {}

reqData = {"m_acy":Year,
            "m_sem":Semester,
            "m_acyend":Year,
            "m_semend":Semester,
            "m_dep_uid":"**",
            "m_group":"**",
            "m_grade":"**",
            "m_class":"**",
            "m_option":"**",
            "m_crsname":"**",
            "m_teaname":"**",
            "m_cos_id":"**",
            "m_cos_code":"**",
            "m_crstime":"**",
            "m_crsoutline":"**",
            "m_costype":"**",
            "m_selcampus":"**"}
for dep in data_dep:
    if Verbose:
        print("[Info] Getting course data in department %s (%s)"%(data_dep_name[dep],dep))
    reqData["m_dep_uid"] = dep
    res = requests.post(baseURL+"?r=main/get_cos_list",data = reqData,headers={'user-agent': 'Mozilla/5.0'},verify=False)
    if res.status_code != 200:
        print("Request course data error!! (dep: %s)"%dep)
    OriginData = json.loads(res.text)
    #print(OriginData)

    #with open("origin.json","r") as f:
    #    OriginData = json.loads(f.read())

    for D in OriginData:
        for SID in OriginData[D]:
            if re.match("^[0-9]+$",SID) == None:
                continue
            #print(SID)
            for CourseID in OriginData[D][SID]:
                if CourseID in CourseData:
                    continue
                C = OriginData[D][SID][CourseID]
                CourseData[CourseID] = {
                    "id": C["cos_id"],
                    "code": C["cos_code"],
                    "name": C["cos_cname"] + ' ' + C["cos_ename"],
                    "time": C["cos_time"],
                    "credit": C["cos_credit"],
                    "hours": C["cos_hours"],
                    "teacher": C["teacher"],
                    "num_limit": C["num_limit"],
                    "reg_num": C["reg_num"],
                    "memo": C["memo"],
                }
                if Verbose:
                    print("[Info] Get course - %s %s"%(C["cos_cname"], C["teacher"]))
print("[Info] Total %d courses got."%len(CourseData))

with open(f'data/{ysem}.json',"w") as f:
    json.dump(CourseData, f, sort_keys=True, ensure_ascii=False, indent=2)
if github_output := getenv('GITHUB_OUTPUT'):
    with open(github_output, 'w+') as f:
        f.write(f'ysem={ysem}')
