from lanzou.api import LanZouCloud
import os
import re
import shutil

def login_by_cookie(cookie):
    """ 使用cookie登录蓝奏云 """
    lanzou = LanZouCloud()
    login_status = lanzou.login_by_cookie(cookie)
    if login_status == LanZouCloud.SUCCESS:
        print("登录成功")
        return lanzou
    else:
        print(f"登录失败, 返回信息: {login_status.message}")
        return None

def get_version_from_file(file_path):
    """ 从文件中提取版本号 """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            version = re.search(r'@version\s+([\d.]+)', content).group(1)
            return version
    except Exception as e:
        print(f"读取文件版本号失败: {str(e)}")
        return None

def upload_to_lanzou_if_newer(lanzou, file_path, folder_id):
    """ 如果本地文件版本较新，则上传到蓝奏云 """
    try:
        local_version = get_version_from_file(file_path)
        if local_version is None:
            return
        
        # 更改文件扩展名为 .txt，因为蓝奏云可能限制某些类型文件的直接上传
        base = os.path.splitext(file_path)[0]
        txt_file_path = base + ".txt"
        shutil.copy(file_path, txt_file_path)

        # 检查云端是否存在此文件
        file_name = os.path.basename(txt_file_path)
        cloud_files = lanzou.get_file_list(folder_id)
        
        print(f"文件路径: {txt_file_path}")
        print(f"检查云端是否存在文件 {file_name} ...")
        print('云端文件列表:')
        print(cloud_files)
        print(f"本地版本: {local_version}")
        cloud_file_info = cloud_files.find_by_name(file_name)
        if cloud_file_info:
            cloud_version = get_version_from_file(txt_file_path)
            if cloud_version and local_version <= cloud_version:
                print(f"云端文件 {file_name} 的版本 ({cloud_version}) 不低于本地版本 ({local_version})，不进行更新。")
                os.remove(txt_file_path)
                return
            else :
                print(f"云端文件 {file_name} 的版本 ({cloud_version}) 低于本地版本 ({local_version})，将进行更新。")
        else:
            print(f"云端不存在文件 {file_name}，将进行上传。")
        
        # 上传文件
        code = lanzou.upload_file(txt_file_path, folder_id)
        if code == LanZouCloud.SUCCESS:
            print("文件上传成功")
        else:
            print(f"上传失败，错误码: {code}")
        
        # 删除临时的 .txt 文件
        os.remove(txt_file_path)
    except Exception as e:
        print(f"执行过程中发生错误: {str(e)}")

def get_folder_id_by_name(lanzou, folder_name):
    """ 通过文件夹名获取文件夹ID """
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
file_path_user_js = 'dist/your-script.user.js'
file_path_meta_js = 'dist/your-script.meta.js'

lanzou = login_by_cookie(cookie)  # 进行登录
if lanzou:
    folder_id = get_folder_id_by_name(lanzou, folder_name)  # 获取文件夹 ID
    if folder_id:
        upload_to_lanzou_if_newer(lanzou, file_path_user_js, folder_id)  # 上传文件
        upload_to_lanzou_if_newer(lanzou, file_path_meta_js, folder_id)  # 上传文件



