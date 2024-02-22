import Toast from '@vant/weapp/toast/toast';
// 获取用户表
const db = wx.cloud.database()
const user = db.collection('user')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    showAvatar: false,      // 是否显示修改头像弹窗
    showNickName: false,    // 是否显示修改昵称弹窗 
    saveUserAvatar: false,  // 是否保存用户头像
    saveUserNickName: false, // 是否保存用户昵称
    // avatarUrl旧头像链接、头像渲染连接
    // newAvatarUrl新头像链接
    // nickName昵称渲染昵称
    // preInputBottom输入框键盘高度改变前的高度（弹出、收起键盘都算）
    // inputBottom输入框键盘高度改变后的高度
    // openid用于存储头像
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log("onLoad");
    // 1.获取当前用户的头像链接、昵称
    wx.cloud.callFunction({
      name: 'getAvatarAndNickName'
    }).then(res => {
      console.log('getAvatarAndNickName:', res)
      this.setData({
        avatarUrl: res.result.avatarUrl,
        nickName: res.result.nickName,
        openid: res.result.openid
      })
    }).catch(err => {
      console.log('getAvatarAndNickName:', err)
      Toast('获取头像、昵称失败')
    })
  },

  // 点击修改头像
  changeAvatar() {
    console.log('changeAvatar');
    this.showPopupAvatar();
  },

  // 点击修改昵称
  changeNickName() {
    console.log('changeNickName');
    this.showPopupNickName();
  },

  // 弹出修改头像弹窗
  showPopupAvatar() {
    console.log('showPopupAvatar');
    this.setData({ showAvatar: true });
  },

  // 关闭修改头像弹窗
  onCloseAvatar() {
    console.log('onCloseAvatar');
    this.setData({
      showAvatar: false,
      saveUserAvatar: false
    });
  },

  // 弹出修改昵称弹窗
  showPopupNickName() {
    console.log('showPopupNickName');
    this.setData({ showNickName: true });
  },

  // 关闭修改昵称弹窗
  onCloseNickName() {
    console.log('onCloseNickName');
    this.setData({
      showNickName: false,
      saveUserNickName: false
    });
  },

  // 选择头像（选完才调用）
  onChooseAvatar(e) {
    console.log('onChooseAvatar');
    // 1.获取临时的新头像链接
    const  newAvatarUrl  = e.detail.avatarUrl
    // 2.新增一个字段存储临时头像链接
    this.setData({
      newAvatarUrl,
      saveUserAvatar: true
    })
  },

  // 填写昵称，input的change事件响应
  changeNickNameInput(e) {
    console.log('changeNickeNameInput');
    // 设置允许绑定昵称
    this.setData({
      saveUserNickName: true
    })
  },

  // 昵称输入框，软件盘heightchange事件响应
  bindkeyboardheightchange(e) {
    console.log('bindkeyboardheightchange');
    // 1.如果键盘高度没有变化，直接返回
    if (this.data.preInputBottom && this.data.inputBottom && this.data.preInputBottom === this.data.inputBottom) {
      return;
    }
    // 2.如果键盘高度没有记录，直接设置（preInputButtom是inputButtom的前置属性）
    if (!this.data.inputBottom) {
      this.setData({ inputBottom: e.detail.height })
    } else {
      // 3.如果键盘高度有记录，设置preInputButtom和inputButtom
      this.setData({
        preInputBottom: this.data.inputBottom,
        inputBottom: e.detail.height
      })
    }
  },

  // 修改头像点击事件
  async handleInputAvatarAfter() {
    console.log('handleInputAvatarAfter');
    // 如果不允许保存
    if (this.data.saveUserAvatar == false) {
      Toast('请先选择新头像')
    } else {
      // 0.获取新头像、旧头像
      const newAvatarUrl = this.data.newAvatarUrl;
      const avatarUrl = this.data.avatarUrl;
      console.log('newAvatarUrl：' + newAvatarUrl);
      console.log('avatarUrl：' + avatarUrl);

      // 0.通过field删除旧图片
      await wx.cloud.deleteFile({
        fileList: [avatarUrl]
      }).then(res => {
        console.log('删除原来头像成功：' + res.fileList);
      }).catch(err => {
        console.log('删除原来头像失败：' + err);
      })

      // 1.将头像上传
      await wx.cloud.uploadFile({
        // 1.1云存储的图片路径
        cloudPath: this.data.openid+new Date().getTime() + '.png',
        // 1.2上传文件的URL
        filePath: newAvatarUrl
      }).then(res => {
        // 1.3获取上传成功的文件id,重置avatarUrl
        let fileId = res.fileID;
        console.log('上传成功：' + fileId);
        this.setData({
          avatarUrl: fileId
        })
        // 1.4将avatarUrl写入User表
        user.where({
          _openid: this.data.openid
        }).update({
          data: {
            avatarUrl: fileId
          }
        }).then(res => {
          console.log('更新成功：' + res);
        }).catch(err => {
          console.log('更新失败：' + err);
        })
      }).catch(err => {
        console.log('上传失败：' + err);
      })

      // 2.关闭头像弹窗
      this.onCloseAvatar();
    }
  },

  // 修改昵称点击事件
  async handleInputNameAfter() {
    // 将nickname写入user表
    await user.where({
      _openid: this.data.openid
    }).update({
      data: {
        nickName: this.data.nickName
      }
    }).then(res => {
      console.log('更新成功：' + res);
    }).catch(err => {
      console.log('更新失败：' + err);
    })

    // 关闭弹窗
    this.onCloseNickName();
  }


})