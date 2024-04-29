from lanzou.api import LanZouCloud

def login_by_cookie(cookie):
    lanzou = LanZouCloud()
    login_status = lanzou.login_by_cookie(cookie)
    if login_status == LanZouCloud.SUCCESS:
        print("登录成功")
        return lanzou
    else:
        print(f"登录失败, 返回信息: {login_status.message}")
        return None

def upload_to_lanzou(lanzou, file_path, folder_id):
    try:
        # 上传文件
        code = lanzou.upload_file(file_path, folder_id)
        if code == LanZouCloud.SUCCESS:
            print("文件上传成功")
        elif code == LanZouCloud.FAILED:
            print("上传失败")
        elif code == LanZouCloud.PATH_ERROR:
            print("文件路径错误")
        elif code == LanZouCloud.NETWORK_ERROR:
            print("网络异常，请检查网络连接")
        elif code == LanZouCloud.MKDIR_ERROR:
            print("无法在网盘上创建文件夹")
        elif code == LanZouCloud.CAPTCHA_ERROR:
            print("验证码错误")
        elif code == LanZouCloud.OFFICIAL_LIMITED:
            print("官方禁止的操作")
        else:
            print(f"未知错误: {code}")
    except Exception as e:
        print(f"执行过程中发生错误: {str(e)}")

def get_folder_id_by_name(lanzou, folder_name):
    # 获取根目录下的所有文件夹
    folders = lanzou.get_move_folders()
    folder = folders.find_by_name(folder_name)
    if folder:
        print(f"找到文件夹: {folder.name}, ID: {folder.id}")
        return folder.id

    print("未找到指定文件夹")
    return None

# 设置 Cookie
cookie = {
    "ylogin": "3972023",
    "phpdisk_info": 'BzAHPANmDDJXZQdlDmdTAFYyAwheNgFuUmgBYQY4VmBWZQc0DGwEOwMyB14NMlo2UmMMNwxtV2EEMgA1AGcLOQc2BzYDZwwzVzcHZw43UzxWNAM3Xj4BNVJmATAGM1Y3VjAHYAw4BDwDMgc0DV5aMVI6DDcMZVc4BDMAZwA3CzsHMAc2'
}
folder_name = "油猴脚本-体检辅助系统"
file_path = 'dist/your-script.user.js'

lanzou = login_by_cookie(cookie)  # 进行登录
if lanzou:
    folder_id = get_folder_id_by_name(lanzou, folder_name)  # 获取文件夹 ID
    if folder_id:
        upload_to_lanzou(lanzou, file_path, folder_id)  # 上传文件


