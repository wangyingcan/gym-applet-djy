// 0.引入数据库
const db = wx.cloud.database();
// 1.获取集合
const courseTable = db.collection('CourseTable');
// 2.登录用户信息缓存
const loginCacheKey = "loginInfo"
// 3.引入Toast库
import Toast from '@vant/weapp/toast/toast';
// 4.引入工具函数
import {
  getDate
} from "../../utils/date"

import {
  findNearestCourse
} from "../../utils/nearestCourseInfo"

Page({

  /**
   * 〇、页面的初始数据
   */
  data: {
    // 从数据库中读取的userInfo（默认情况的假数据）
    userInfo: {
      avatarUrl: 'cloud://dev-3g5cl9ca65d64f4b.6465-dev-3g5cl9ca65d64f4b-1324237307/1707967944569.png',
      nickName: '登录 / 注册',
      monthlyCardIds: [],
      weeklyCardIds: [],
      expiredCardIds: [],
      thisMonthCourseRecordNum: 0,
      canceledClassNum: 0
    },
    bookedCourseNum: 0,
    status: 0,      // status中0代表登出、1代表登入
    isNewUser: false,   // 是否是新用户
    openid: '',         // 用户的openid，用于生成头像链接
    show: false,      // 是否显示弹窗
    // avatarUrl注册阶段获取的头像链接
    // nickName注册阶段获取的昵称
    // canSaveUser是否达到保存用户的条件（头像、昵称均非空）
    // preInputBottom输入框键盘高度改变前的高度（弹出、收起键盘都算）
    // inputBottom输入框键盘高度改变后的高度
    // bookedCourseList用户已预约课程列表
    // today 今天年月日
    // latelyMonth 最近的预约课程月份
    latelyMonth: 0,
    // latelyDate 最近的预约课程日期
    latelyDate: 0,
    // latelyHour 最近的预约课程小时
    latelyHour: 0,
    // latelyCourseName 最近的预约课程名称
    latelyCourseName: '',
    // latelyHourGap 最近的预约课程小时差
    latelyHourGap: 0,
    // latelyMinuteGap 最近的预约课程分钟差
    latelyMinuteGap: 0,
    // 有无最近预约课程
    hasLatelyCourse: false,
  },

  /**
   * 一、生命周期函数 
   */
  onShow() {
    console.log('onShow');
    // 1.每次进入页面，在数据库中重新获取数据，保证数据的最新性
    this.getUserInfo()
  },

  onLoad(options) {
    console.log('onLoad');
    // 1.初次加载页面，调用云函数，判断是否是新用户
    wx.cloud.callFunction({
      name: 'isNewUser'
    }).then(res => {
      console.log('isNewUser:', res)
      const { isNewUser, openid } = res.result
      // 2.设置isNewUser、openid，前者用于判断点击事件响应（showPopup、login），后者用于生成头像链接
      this.setData({
        isNewUser,
        openid
      })
    }).catch(err => {
      console.log('isNewUser:', err)
    })
    // 2.设置今天年月日
    const today = getDate()
    this.setData({
      today
    })
  },

  onPullDownRefresh() {
    console.log('onPullDownRefresh');
    // 1.每次页面下拉刷新，在数据库中重新获取数据，保证数据的最新性
    this.getUserInfo()
  },

  /**
   * 二、注册区
   */

  // 选择头像
  onChooseAvatar(e) {
    console.log('onChooseAvatar');
    // 1.获取临时的头像链接
    const { avatarUrl } = e.detail
    // 2.新增一个字段存储临时头像链接
    this.setData({
      avatarUrl
    })
    // 3.检查是否可以保存用户信息（昵称、头像都指定）
    this.observerCanSaveUser();
  },

  // 填写昵称，input的change事件响应
  changeNickNameInput(e) {
    console.log('changeNickeNameInput');
    // 1.检查是否可以保存用户信息（昵称、头像都指定）
    this.observerCanSaveUser();
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

  // 检查是否可以保存用户信息（昵称、头像都指定）
  observerCanSaveUser() {
    console.log('observerCanSaveUser');
    // 1.如果昵称和头像都指定，可以保存用户信息
    if (this.data.nickName && this.data.avatarUrl) {
      this.setData({
        canSaveUser: true
      })
    } else {
      // 2.否则不能保存用户信息
      this.setData({
        canSaveUser: false
      })
    }
  },

  // 授权按钮点击事件
  async handleInputAvatarNameAfter() {
    console.log('handleInputAvatarNameAfter');
    // 0.获取头像、昵称
    const avatarUrl = this.data.avatarUrl;
    const nickName = this.data.nickName;
    console.log('avatarUrl：' + avatarUrl);
    let that = this
    // 1.将头像上传
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
    // 2.调用login，真正注册用户
    await this.login()
    // 3.关闭弹窗
    await this.setData({
      show: false
    })
  },

  // 弹出弹窗
  showPopup() {
    console.log('showPopup');
    this.setData({ show: true });
  },

  // 关闭弹窗
  onClose() {
    console.log('onClose');
    this.setData({ show: false });
  },

  // 点击响应事件判断逻辑
  handleTap() {
    console.log('handleTap');
    if (this.data.isNewUser) {
      this.showPopup();
    } else {
      this.login();
    }
  },

  /**
   * 三、登录区
   */
  // 用户信息更新
  async getUserInfo() {
    console.log('getUserInfo');
    // 1.判断用户是否已登录（有无缓存）
    const data = wx.getStorageSync(loginCacheKey)
    if (data) {
      // 2.data存在代表已登录，此处获取最新的数据
      // 2.1获取最新的预约课表、预约课程数
      const { result: { bookedCourseList, bookedCourseNum } } = await wx.cloud.callFunction({
        name: 'getBookedCourseList'
      })
      console.log('bookedCourseList:', bookedCourseList);
      console.log('bookedCourseNum:', bookedCourseNum);
      // 2.2获取最新用户信息
      const latelyUserInfo = await wx.cloud.database().collection('user').doc(data._id).get();
      console.log(latelyUserInfo);
      // 2.3在bookedCourseList中依据date、startHour找出最近的预约课程信息
      if (bookedCourseList.length > 0) {
        // 2.3.1有课的时候才进行最近课程的信息获取
        const { year, month, date, hour, courseName } = findNearestCourse(bookedCourseList);    //工具函数解析进行list比较同时返回信息
        const hourGap = Math.floor((new Date(year, month - 1, date, hour, 0, 0).getTime() - new Date().getTime()) / (1000 * 60 * 60));   //计算时差
        const minuteGap = Math.ceil((new Date(year, month - 1, date, hour, 0, 0).getTime() - new Date().getTime() - hourGap * (1000 * 60 * 60)) / (1000 * 60));    //计算分差
        console.log('hourGap:', hourGap);
        console.log('minuteGap:', minuteGap);
        console.log('month:', month);
        console.log('date:', date);
        console.log('hour:', hour);
        console.log('courseName:', courseName);
        // 3.设置最新的用户信息、预约课程数、预约课程列表、最近的预约课程信息
        await this.setData({
          userInfo: latelyUserInfo.data,
          bookedCourseNum,
          bookedCourseList,
          latelyMonth: month,
          latelyDate: date,
          latelyHour: hour,
          latelyCourseName: courseName,
          latelyHourGap: hourGap,
          latelyMinuteGap: minuteGap,
          hasLatelyCourse: true
        })
      }else{
        // 2.3.2没有课的时候，设置最新的用户信息、预约课程数
        await this.setData({
          userInfo: latelyUserInfo.data,
          bookedCourseNum,
          bookedCourseList,
          hasLatelyCourse: false
        })
      }
    }
  },

  // 登录按钮点击事件 + 后端注册
  async login() {
    console.log('login');
    // 0.自定义加载图标
    Toast.loading({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    // 1.用户授权获取信息
    const { avatarUrl, nickName } = this.data
    // 2.将用户信息交付云函数，存储生成账号（openid）
    const { result: { data } } = await wx.cloud.callFunction({
      name: 'login',   // 调用的云函数名称
      data: {              // 传入调用的云函数中的event参数
        avatarUrl,
        nickName
      }
    })
    console.log('云函数返回数据data:', data)
    // 3.设置登录缓存
    wx.setStorageSync(loginCacheKey, data)
    // 4.设置data到小程序端
    await this.setData({
      userInfo: data,
      status: 1
    })
    // 5.再次刷新一下用户数据
    await this.getUserInfo()
    // 6.加入”登录成功“轻提示
    Toast('登录成功');
  },

  /**
   * 四、登出区 
   */
  // 退出登录按钮点击事件响应
  logout() {
    console.log('logout');
    // 1.删除登录缓存
    wx.removeStorageSync(loginCacheKey)
    // 2.设置初始信息
    const userDefaultInfo = {
      avatarUrl: 'cloud://dev-3g5cl9ca65d64f4b.6465-dev-3g5cl9ca65d64f4b-1324237307/1707967944569.png',
      nickName: '登录 / 注册',
      monthlyCardIds: [],
      weeklyCardIds: [],
      expiredCardIds: [],
      bookedCourseNum: 0,
      thisMonthCourseRecordNum: 0,
      canceledClassNum: 0
    }
    // 3.设置登出状态+默认用户信息
    this.setData({
      status: 0,
      userInfo: userDefaultInfo,
      bookedCourseNum: 0
    })
  },

  /**
   * 五、其他区
   */
  // 重定向管理员按钮点击事件
  redirectToAdministrator() {
    wx.navigateTo({
      url: '/pages/administrator/index',
    })
  },

  // 重定向到约课详情
  redirectToCourseDetail() {
    // 1.检查是否登录
    if (this.data.status === 0) {
      // 2.未登录状态不允许跳转到约课详情页
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return;
    }
    // 2.登录状态允许跳转到约课详情页
    wx.navigateTo({
      url: '/pages/bookedCourseDetail/index',
    })
  },

  // 重定向到本月上课记录详情
  redirectToMonthCourseRecord() {
    // 1.检查是否登录
    if (this.data.status === 0) {
      // 2.未登录状态不允许跳转到本月上课记录详情页
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return;
    }
    // 2.登录状态允许跳转到本月上课记录详情页
    wx.navigateTo({
      url: '/pages/monthlyCourseDetail/index',
    })
  },

  // 重定向到已取消详情
  redirectToCanceledDetail() {
    // 1.检查是否登录
    if (this.data.status === 0) {
      // 2.未登录状态不允许跳转到已取消详情页
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return;
    }
    // 2.登录状态允许跳转到已取消详情页
    wx.navigateTo({
      url: '/pages/canceledCourseDetail/index',
    })
  },

})