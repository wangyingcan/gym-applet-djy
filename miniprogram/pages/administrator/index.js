// 0.引入数据库
const db = wx.cloud.database();
// 1.获取集合
const courseTable = db.collection('CourseTable');
const monthlyCards = db.collection('monthlyCards');
const weeklyCards = db.collection('weeklyCards')
// 2.登录用户信息缓存
const loginCacheKey = "loginInfo"


Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 云存储文件id（默认头像已存储到云端）
    userInfo: {
      avatarUrl: 'cloud://prod-5g2wkpjaadb1bf82.7072-prod-5g2wkpjaadb1bf82-1324237307/imagesdefaultBorderAvatar.png',
      nickName: '登录 / 注册',
      testField: 1,
    },
    status: 0,      // status中0代表登出、1代表登入
    isNewUser: false,   // 是否是新用户
    openid: '',         // 用户的openid，用于生成头像链接
    show: false,      // 是否显示弹窗
  },

  handleTap() {
    console.log('handleTap');
    if (this.data.isNewUser) {
      this.showPopup();
    } else {
      this.login();
    }
  },

  showPopup() {
    console.log('showPopup');
    this.setData({ show: true });
  },

  onClose() {
    console.log('onClose');
    this.setData({ show: false });
  },

  // 选择头像
  onChooseAvatar(e) {
    console.log('onChooseAvatar');
    // 获取临时的头像链接
    const { avatarUrl } = e.detail
    this.setData({
      avatarUrl     // 默认新增一个字段存储临时头像链接
    })
    this.observerCanSaveUser();
  },

  //实际只有这个方法用到了
  changeNickNameInput(e) {
    console.log('changeNickeNameInput');
    // 检查是否可以保存用户信息（昵称、头像都指定）
    this.observerCanSaveUser();
  },

  // 昵称输入框 软件盘高度改变
  bindkeyboardheightchange(e) {
    console.log('bindkeyboardheightchange');
    if (this.data.preInputBottom && this.data.inputBottom && this.data.preInputBottom === this.data.inputBottom) {
      return;
    }
    if (!this.data.inputBottom) {
      this.setData({ inputBottom: e.detail.height })
    } else {
      this.setData({
        preInputBottom: this.data.inputBottom,
        inputBottom: e.detail.height
      })
    }
  },

  observerCanSaveUser() {
    console.log('observerCanSaveUser');
    if (this.data.nickName && this.data.avatarUrl) {
      this.setData({
        canSaveUser: true
      })
    } else {
      this.setData({
        canSaveUser: false
      })
    }
  },

  // 头像、昵称同时输入完后才保存，保存成功再关闭
  async handleInputAvatarNameAfter() {
    console.log('handleInputAvatarNameAfter');
    // 0.获取头像、昵称
    const avatarUrl = this.data.avatarUrl;
    const nickName = this.data.nickName;
    console.log('avatarUrl：' + avatarUrl);
    let that = this
    // 1.将默认头像上传
    await wx.cloud.uploadFile({
      // 1.1云存储的图片路径
      cloudPath: that.data.openid + '.png',
      // 1.2上传文件的URL
      filePath: avatarUrl
    }).then(res => {
      console.log('进入then了吗', JSON.stringify(res));
      // 1.3获取上传成功的文件id
      let fileId = res.fileID;
      console.log('上传文件的FileId：', fileId);
      // 1.4将头像、昵称设置到data中
      that.setData({
        avatarUrl: fileId,
        nickName
      })
    }).catch(err => {
      console.log('上传失败：' + err);
    })
    // 3.调用login，真正注册用户
    await this.login()
  },

  onLoad(options) {
    console.log('onLoad');
    // 1.调用云函数，判断是否是新用户
    wx.cloud.callFunction({
      name: 'isNewUser'
    }).then(res => {
      console.log('isNewUser:', res)
      const { isNewUser, openid } = res.result
      this.setData({
        isNewUser,
        openid
      })
    }).catch(err => {
      console.log('isNewUser:', err)
    })
  },

  // 获取用户授权
  async login() {
    console.log('login');
    // 1.用户授权获取信息
    const { avatarUrl, nickName } = this.data

    // 2.将用户信息交付云函数，存储生成账号（openid）
    const { result: { data } } = await wx.cloud.callFunction({
      name: 'loginTest',   // 调用的云函数名称
      data: {              // 传入调用的云函数中的event参数
        avatarUrl,
        nickName
      }
    })
    console.log('云函数返回数据data:', data)

    // 3.设置登录缓存
    wx.setStorageSync(loginCacheKey, data)

    // 4.设置data到小程序端
    this.setData({
      userInfo: data,
      status: 1
    })
  },

  onShow() {
    console.log('onShow');
    this.getUserInfo()
  },

  async getUserInfo() {
    console.log('getUserInfo');
    // 1.判断用户是否已登录
    const data = wx.getStorageSync(loginCacheKey)
    if (data) {
      // 2.data存在代表已登录，此处获取最新的数据
      const latelyUserInfo = await wx.cloud.database().collection('userInfoTest').doc(data._id).get();
      // 3.设置最新的用户信息
      this.setData({
        userInfo: latelyUserInfo
      })
    }
  },

  logout() {
    console.log('logout');
    // 1.删除登录缓存
    wx.removeStorageSync(loginCacheKey)
    // 2.设置初始信息
    const userDefaultInfo = {
      avatarUrl: 'cloud://prod-5g2wkpjaadb1bf82.7072-prod-5g2wkpjaadb1bf82-1324237307/imagesdefaultBorderAvatar.png',
      nickName: '登录 / 注册',
      testField: 1
    }
    this.setData({
      status: 0,
      userInfo: userDefaultInfo
    })
  },


  // 上传文件到云存储
  onChooseAvatar1(e) {

    // 0.解析本地文件
    console.log('e.detail：' + JSON.stringify(e.detail));
    const { avatarUrl } = e.detail
    console.log('avatarUrl：' + avatarUrl);
    let that = this
    // 1.将默认头像上传
    wx.cloud.uploadFile({
      // 1.1云存储的图片路径
      cloudPath: new Date().getTime() + '.png',
      // 1.2上传文件的URL
      filePath: avatarUrl
    }).then(res => {
      console.log('进入then了吗', JSON.stringify(res));
      // 1.3获取上传成功的文件id
      let fileId = res.fileID;
      console.log('上传文件的FileId：', fileId);
      // 1.4设置到data中
      that.setData({
        avatarUrl: fileId
      })
    }).catch(err => {
      console.log('上传失败：' + err);
    })

  },

  // 向集合中批量插入数据
  insertCourses() {
    courseTable.add({
      data: {
        "date": "2024.3.15",
        "index": 5,
        "courses": [
          {
            "startHour": 9,
            "courseLength": 1,
            "status": 3,
            "courseName": "",
            "coachName": "",
            "students": []
          },
          {
            "startHour": 10,
            "courseLength": 1,
            "status": 3,
            "courseName": "",
            "coachName": "",
            "students": []
          },
          {
            "startHour": 11,
            "courseLength": 1,
            "status": 3,
            "courseName": "",
            "coachName": "",
            "students": []
          },
          {
            "startHour": 12,
            "courseLength": 1,
            "status": 3,
            "courseName": "",
            "coachName": "",
            "students": []
          },
          {
            "startHour": 13,
            "courseLength": 1,
            "status": 3,
            "courseName": "",
            "coachName": "",
            "students": []
          },
          {
            "startHour": 14,
            "courseLength": 1,
            "status": 3,
            "courseName": "",
            "coachName": "",
            "students": []
          },
          {
            "startHour": 15,
            "courseLength": 1,
            "status": 3,
            "courseName": "",
            "coachName": "",
            "students": []
          },
          {
            "startHour": 16,
            "courseLength": 1,
            "status": 3,
            "courseName": "",
            "coachName": "",
            "students": []
          },
          {
            "startHour": 17,
            "courseLength": 1,
            "status": 3,
            "courseName": "",
            "coachName": "",
            "students": []
          },
          {
            "startHour": 18,
            "courseLength": 1,
            "status": 3,
            "courseName": "",
            "coachName": "",
            "students": []
          },
          {
            "startHour": 19,
            "courseLength": 1,
            "status": 3,
            "courseName": "",
            "coachName": "",
            "students": []
          },
          {
            "startHour": 20,
            "courseLength": 1,
            "status": 3,
            "courseName": "",
            "coachName": "",
            "students": []
          },
          {
            "startHour": 21,
            "courseLength": 1,
            "status": 3,
            "courseName": "",
            "coachName": "",
            "students": []
          },
        ],
      }
    }).then(res => {
      console.log('插入成功', res)
    }).catch(err => {
      console.log('插入失败', err)
    })
  },

  callFunction(e) {
    wx.cloud.callFunction({
      name: 'setInterval'
    }).then(res => {
      console.log("调用了setInterval吗1？？？" + res)
    }).catch(err => {
      console.log("调用了setInterval吗2？？？" + err)
    })
  },

  async insertCards(e) {
    await monthlyCards.add({
      data: {
        cardId: "oS-PG64WoFk4zbqnPZQqrnLyms6U999999991",
        status: "active",
        remainingDays: 1,
        purchaseDate: "2024.2.19",
        activationDate: "2024.2.19",
        hasPaused: false,
        pauseStart: "",
        pauseEnd: "",
      }
    });
    await monthlyCards.add({
      data: {
        cardId: "oS-PG64WoFk4zbqnPZQqrnLyms6U999999992",
        status: "active",
        remainingDays: 2,
        purchaseDate: "2024.2.19",
        activationDate: "2024.2.19",
        hasPaused: false,
        pauseStart: "",
        pauseEnd: "",
      }
    });
    await monthlyCards.add({
      data: {
        cardId: "oS-PG64WoFk4zbqnPZQqrnLyms6U999999993",
        status: "paused",
        remainingDays: 22,
        purchaseDate: "2024.2.11",
        activationDate: "2024.2.11",
        hasPaused: true,
        pauseStart: "2024.2.12",
        pauseEnd: "",
      }
    });
    await monthlyCards.add({
      data: {
        cardId: "oS-PG64WoFk4zbqnPZQqrnLyms6U999999994",
        status: "paused",
        remainingDays: 22,
        purchaseDate: "2024.2.11",
        activationDate: "2024.2.11",
        hasPaused: true,
        pauseStart: "2024.2.13",
        pauseEnd: "",
      }
    });
    await weeklyCards.add({
      data: {
        cardId: "oS-PG64WoFk4zbqnPZQqrnLyms6U999999995",
        status: "active",
        remainingDays: 1,
        purchaseDate: "2024.2.18",
        activationDate: "2024.2.18",
      }
    })
  }


})