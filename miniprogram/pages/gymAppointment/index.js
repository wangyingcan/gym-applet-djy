import Toast from '@vant/weapp/toast/toast';
// 0.引入数据库
const db = wx.cloud.database();
// 1.获取集合
const courseTable = db.collection('CourseTable');
// 2.设置本周课程缓存、下周课程缓存、登录信息缓存
const thisWeekCourseCacheKey = 'thisWeekCourses';
const nextWeekCourseCacheKey = 'nextWeekCourses';
const loginCacheKey = "loginInfo"

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 是否允许切换下一周(是否到了周五22点、是否到了周日22点)   
    showNextWeek: false,
    // showLeftTextArea是否显示左侧文本区域
    // 展示此周或是下周数据(true本周、false下周两个取值)
    thisWeekOrNextWeek: false,
    // 今天的日期，可以通过Date获取
    // today的年份
    // startDay的月份
    // today的日期
    // today的星期
    // today所在那周的日期列表
    // today所在那周的起始日期
    // today所在那周的终止日期
    weekIndexText: ['一', '二', '三', '四', '五', '六', '日'],// index和周数汉字映射
    monthIndexText: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二',],// index和月份汉字映射
    weekDayCount: 7,// 一周的天数
    // 这一周的日期数组（12）
    thisWeekDates: [],
    // 下一周的日期数组（2024.2.19）
    nextWeekDates: [],
    // 下一周的年份nextYear
    // 下一周的月份nextMonth
    // 下一周的起始日期nextStartDay
    // 下一周的终止日期nextEndDay
    // 下一周的日期数组（19）
    nextWeekDates1: [],
    // 这一周的课程真实数据
    courseList: [],
    // 下一周的课程真实数据
    nextWeekCourseList: [],
    // 是否是第一次进入
    firstEntry: true,
    // 可用月卡列表
    usableMonthCards: [],
    // 可用周卡列表
    usableWeekCards: [],
    // 可用卡列表
    usableCards: [],
    // 可用月卡数量
    usableMonthCardNum: 0,
    // 可用周卡数量
    usableWeekCardNum: 0,
    // 可用卡数量
    usableCardNum: 0,
    // picker名字数组
    range: [],
    // picker选择的index
    pickerIndex: 0,
    // 预约课程的date、startHour
    // 每分钟整秒的定时器
    timer: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    console.log("onLoad函数执行了");
    // console.log("外部this："+JSON.stringify(this))
    // 0.获取系统宽度，由于给课程块定位
    const { windowWidth } = wx.getSystemInfoSync()
    let app = getApp();
    let exchangeRate = app.globalData.exchangeRate;
    // van-config-provider中提供的themeVars变量
    let themeVars={
      noticeBarHeight:'40px'
    };
    this.setData({
      windowWidth,
      thisWeekOrNextWeek: true,
      exchangeRate,
      themeVars
    })
    await this.refreshData();

    // 1.更新完之后就可以设置firstEntry了
    // console.log("内部this："+JSON.stringify(this))
    await this.setData({
      firstEntry: false
    })
  },

  onShow() {
    console.log('onShow')
    let that=this;
    // 1. 计算当前和下一分钟整秒的时间差
    that.checkTime();
    const nowSeconds=new Date().getSeconds();
    const delay=(60-nowSeconds)*1000;
    // 2. 执行一次的setTimeout，设置timer保证之后定时器是每分钟整秒执行
    setTimeout(()=>{
      that.checkTime();
      that.setData({
        timer: setInterval(()=>{
          that.checkTime();
        }, 60*1000)
      })
    },delay)
    // 1.判断是否登录
    const data = wx.getStorageSync(loginCacheKey);
    // 1.1没有登录
    if (!data) {
      // 1.1.1提示“请登录”（onShow中onLoad之后进行，setTimeout和onLoad同步进行，所以onLoad大约5秒、此处要大于5秒才会可见）
      Toast({
        message: '请先登录',
        duration: 6000,
        forbidClick:true,
        selector: '#van-toast-appointment'
      });
      // 1.1.2设置一秒定时器
      setTimeout(() => {
        // 1.1.3跳转`我的卡包`页面
        wx.switchTab({
          url: '/pages/gymMyCardPack/index',
        })
      }, 7000)
      return;
    }else{
      this.refreshData()
    }
  },

  onHide() {
    // 清除定时器
    clearInterval(this.data.timer);
  },

  // 检查是否到了更新时间
  checkTime() {
    let now = new Date();
    let start1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0, 0, 0);
    let end1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 1, 0, 0);
    let start2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    let end2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 1, 0, 0);
    if ((now >= start1 && now <= end1) || (now >= start2 && now <= end2)) {
      this.reloadSystem();
    }
  },

  reloadSystem() {
    Toast.loading({
      message: '系统更新中，请耐心等待2分钟...',
      forbidClick: true,
      loadingType: 'spinner',
      mask: true,
      duration: 90000,
      zindex:9999,
      selector: '#van-toast-appointment'
    });
  },

  // 刷新按钮点击事件
  refresh(e) {
    console.log("refresh函数执行了");
    const toast = Toast.loading({
      duration: 0, // 持续展示 toast
      forbidClick: true,
      message: '倒计时 6 秒',
      selector: '#custom-selector',
    });

    let second = 6;
    const timer = setInterval(() => {
      second--;
      if (second) {
        toast.setData({
          message: `倒计时 ${second} 秒`,
          forbidClick:true
        });
      } else {
        clearInterval(timer);
        Toast.clear();
      }
    }, 1000);

    this.refreshData()
  },

  // 刷新：清缓存、加载数据库数据、切换下一周的状态
  refreshData() {
    console.log("refreshData函数执行了");
    // 0.周五22点到周日22点内showNextWeek为true,否则为false（numOfWeek有星期信息，new Date().getHours()有小时信息）
    this.getToday();
    const numOfWeek = this.data.numOfWeek;
    //const nowHour = new Date("2024-2-23 22:00:01").getHours();
    const nowHour = new Date().getHours();
    console.log("numOfWeek", numOfWeek);
    console.log("nowHour", nowHour);
    // 0.1.1 周五22点之后，周六，周日22点之前
    if ((numOfWeek == 5 && nowHour >= 22) || (numOfWeek == 6) || (numOfWeek == 0 && nowHour < 22)) {
      this.setData({
        showNextWeek: true
      })
    } else {
      this.setData({
        showNextWeek: false
      })
    }

    // 0.1.2 周一~周三不显示左侧文字，周四~周日显示左侧文字
    if(numOfWeek>=1&&numOfWeek<=3){
      this.setData({
        showLeftTextArea:false
      })
    }else{
      this.setData({
        showLeftTextArea:true
      })
    }

    // 1.获取今天的日期，同时会调用getTodayMoreInfo函数，获取更多信息
    this.getToday();
    // 2.去除本地缓存
    wx.removeStorageSync(thisWeekCourseCacheKey);
    wx.removeStorageSync(nextWeekCourseCacheKey);
    // 3.获取这两周的课程信息
    this.getData();
  },

  // 0.获取课程信息
  async getData() {
    console.log("getData函数执行了");
    if (this.data.firstEntry) {     //请注意写法
      // 显示加载提示
      wx.showLoading({
        title: '努力加载课程...',
      });
    }else{
      const toast = Toast.loading({
        duration: 0, // 持续展示 toast
        forbidClick: true,
        message: '倒计时 6 秒',
        selector: '#custom-selector',
      });
  
      let second = 6;
      const timer = setInterval(() => {
        second--;
        if (second) {
          toast.setData({
            message: `倒计时 ${second} 秒`,
            forbidClick:true
          });
        } else {
          clearInterval(timer);
          Toast.clear();
        }
      }, 1000);
    }
    // 0.0.获取缓存
    const thisWeekCourses = wx.getStorageSync(thisWeekCourseCacheKey);
    const nextWeekCourses = wx.getStorageSync(nextWeekCourseCacheKey);
    // 0.0.1如果有缓存就直接使用
    if (thisWeekCourses && nextWeekCourses) {
      this.setData({
        courseList: thisWeekCourses,
        nextWeekCourseList: nextWeekCourses
      })
      // 0.0.2结束
      return;
    }

    // 0.1.获取这周每一天的日期数组（2024.2.12形式）
    let thisWeekDates = this.data.thisWeekDates;
    // 0.2.获取下一周的每一天的日期数组（2024.2.19形式）
    let nextWeekDates = this.data.nextWeekDates;
    //console.log(thisWeekDates);
    //console.log(nextWeekDates);
    // 0.3.获取这周的课程信息
    let courseList = [];    // 初始化数组
    for (let i = 0; i < 7; i++) {
      await courseTable.where({
        date: thisWeekDates[i]
      }).get().then(res => {
        // console.log(res.data);
        if (res.data.length > 0) {
          courseList.push(res.data[0]);
        }
      })
    }
    //设置缓存
    try {
      wx.setStorageSync(thisWeekCourseCacheKey, courseList);
    } catch (e) {

    }
    // 0.4.获取下一周的课程信息
    let nextWeekCourseList = [];    // 初始化数组
    for (let i = 0; i < 7; i++) {
      await courseTable.where({
        date: nextWeekDates[i]
      }).get().then(res => {
        // console.log(res.data);
        if (res.data.length > 0) {
          nextWeekCourseList.push(res.data[0]);
        }
      })
    }
    //设置缓存
    try {
      wx.setStorageSync(nextWeekCourseCacheKey, nextWeekCourseList);
    } catch (e) {

    }
    // 0.5获取可用的月卡
    let { result: { usableMonthCards, usableMonthCardNum } } = await wx.cloud.callFunction({
      name: 'getUsableMonthCards'
    })

    console.log('usableMonthCards:', usableMonthCards);
    console.log('usableMonthCardNum:', usableMonthCardNum);

    // 0.6获取可用的周卡
    let { result: { usableWeekCards, usableWeekCardNum } } = await wx.cloud.callFunction({
      name: 'getUsableWeekCards'
    })
    console.log('usableWeekCards:', usableWeekCards);
    console.log('usableWeekCardNum:', usableWeekCardNum);

    // 0.7可用卡整合（为了对应picker，先月卡后周卡）
    let usableCards = [];
    for (let usableMonthCard of usableMonthCards) {
      usableCards.push(usableMonthCard);
    }
    for (let usableWeekCard of usableWeekCards) {
      usableCards.push(usableWeekCard);
    }
    console.log('usableCards:', usableCards);

    // 0.8构造picker的range
    let range = [];
    for (let monthCard of usableMonthCards) {
      if (monthCard.status === "inactive") {
        range.push(monthCard.cardName + " (未激活)");
      } else if (monthCard.status === "active") {
        range.push(monthCard.cardName + " (已激活)");
      }
    }
    for (let weekCard of usableWeekCards) {
      if (weekCard.status === "inactive") {
        range.push(weekCard.cardName + " (未激活)");
      } else if (weekCard.status === "active") {
        range.push(weekCard.cardName + " (已激活)");
      }
    }
    console.log('range:', range);

    // 隐藏加载提示
    wx.hideLoading();
    if (!this.data.firstEntry) {
      Toast.success({
        message:'更新成功',
        forbidClick:true,
        selector: '#van-toast-appointment'
      });
    }
    // 0.9.更新数据
    this.setData({
      courseList,
      nextWeekCourseList,
      usableMonthCards,
      usableMonthCardNum,
      usableWeekCards,
      usableWeekCardNum,
      usableCards,
      usableCardNum: usableMonthCardNum + usableWeekCardNum,
      range
    })
  },

  // 1.获取今天的日期
  getToday() {
    console.log("getToday函数执行了");
    // 1.1获取此刻的Date对象
    //const date = new Date("2024-2-23 22:00:01");
    const date = new Date();
    // 1.2转换为today格式
    const todayStr = date.getFullYear() + '.' + (date.getMonth() + 1) + '.' + date.getDate();
    // console.log("today : "+todayStr);
    const numOfWeek=date.getDay();
    // const numOfWeek=4;
    let leftTextAreaWidth=(((this.data.windowWidth*2 - 50)*this.data.exchangeRate)/7) *(numOfWeek-1);
    // 1.3更新today
    this.setData({
      today: todayStr,
      year: date.getFullYear(),
      day: date.getDate(),
      numOfWeek,
      leftTextAreaWidth
    })
    // 1.4解析今天信息获取更多数据
    this.getTodayMoreInfo(date.getFullYear(), date.getMonth(), date.getDate())
  },

  // 获取一周的日期
  getWeekDates(startDayOfWeek) {
    console.log("getWeekDates函数执行了");
    let nowWeekDates = [];    // 初始化数组(12)
    let thisWeekDates = [];    // 初始化数组(2024.2.12)
    let nextWeekDates = [];    // 初始化数组(2024.2.19)
    for (let i = 0; i < 7; i++) {   // 遍历获取一周日期
      const iDate = new Date(startDayOfWeek.getTime() + i * 1000 * 60 * 60 * 24);
      nowWeekDates.push(iDate.getDate());
      thisWeekDates.push(iDate.getFullYear() + '.' + (iDate.getMonth() + 1) + '.' + iDate.getDate());
      const jDate = new Date(startDayOfWeek.getTime() + (i + 7) * 1000 * 60 * 60 * 24);
      nextWeekDates.push(jDate.getFullYear() + '.' + (jDate.getMonth() + 1) + '.' + jDate.getDate());
    }
    // 获取下一周的年份
    let nextYear = nextWeekDates[0].split('.')[0];
    // console.log(nextYear);
    // 获取下一周的月份
    let nextMonth = nextWeekDates[0].split('.')[1];
    // console.log(nextMonth);
    // 获取下一周的起始日期
    let nextStartDay = nextWeekDates[0].split('.')[1] + '.' + nextWeekDates[0].split('.')[2];
    // console.log(nextStartDay);
    // 获取下一周的终止日期
    let nextEndDay = nextWeekDates[6].split('.')[1] + '.' + nextWeekDates[6].split('.')[2];
    // console.log(nextEndDay);
    // 获取下一周的日期数组
    let nextWeekDates1 = [];
    for (let i = 0; i < 7; i++) {
      nextWeekDates1.push(nextWeekDates[i].split('.')[2]);
    }
    return [nowWeekDates, thisWeekDates, nextWeekDates, nextYear, nextMonth, nextStartDay, nextEndDay, nextWeekDates1];
  },

  // 2.将今天的日期解析出更多信息（本周始终日期、本周日期数组、本周年月日数组、下周年月日数组）
  getTodayMoreInfo(year, month, day) {
    console.log("getTodayMoreInfo函数执行了");
    // 2.1获取今天信息
    const dayOfWeek = new Date(year, month, day).getDay();// 星期(1开头代表周一、0代表周日)

    // 2.2获取此周的起始日期、终止日期、每天日期
    let startDayOfWeekTime, endDayOfWeekTime, startDayOfWeek, endDayOfWeek, startDay, endDay;
    if (dayOfWeek == 1) {
      // 今天周一时
      // console.log("周一");
      startDayOfWeekTime = new Date(year, month, day).getTime();    // 起始日期（毫秒数）
      endDayOfWeekTime = startDayOfWeekTime + 1000 * 60 * 60 * 24 * 6;    // 终止日期（毫秒数）
    } else if (dayOfWeek == 0) {
      // 今天周日时
      // console.log("周日");
      endDayOfWeekTime = new Date(year, month, day).getTime();
      startDayOfWeekTime = endDayOfWeekTime - 1000 * 60 * 60 * 24 * 6;
    } else {
      // 周中时
      // console.log("今天周" + dayOfWeek);
      let todayOfWeekTime = new Date(year, month, day).getTime();
      let toStartGap = 1000 * 60 * 60 * 24 * (dayOfWeek - 1);
      let toEndGap = 1000 * 60 * 60 * 24 * (7 - dayOfWeek);
      startDayOfWeekTime = todayOfWeekTime - toStartGap;
      endDayOfWeekTime = todayOfWeekTime + toEndGap;
    }

    startDayOfWeek = new Date(startDayOfWeekTime);    // 起始日期（date对象） 
    endDayOfWeek = new Date(endDayOfWeekTime)    // 终止日期（date对象）
    startDay = (startDayOfWeek.getMonth() + 1) + '.' + startDayOfWeek.getDate();    // 起始日期（2.12形式）
    endDay = (endDayOfWeek.getMonth() + 1) + '.' + endDayOfWeek.getDate();    // 终止日期（2.18形式）

    // 验证通过
    // console.log(startDay);
    // console.log(endDay);

    let [nowWeekDates, thisWeekDates, nextWeekDates, nextYear, nextMonth, nextStartDay, nextEndDay, nextWeekDates1] = this.getWeekDates(startDayOfWeek);

    // 验证通过
    // console.log(nowWeekDates);
    // console.log(thisWeekDates);
    // console.log(nextWeekDates);
    // console.log(nextWeekDates1);

    // 设置所有数据
    this.setData({
      startDay: startDay,
      endDay: endDay,
      month: startDayOfWeek.getMonth() + 1,
      nowWeekDates: nowWeekDates,
      thisWeekDates: thisWeekDates,
      nextWeekDates: nextWeekDates,
      nextYear: nextYear,
      nextMonth: nextMonth,
      nextStartDay: nextStartDay,
      nextEndDay: nextEndDay,
      nextWeekDates1: nextWeekDates1
    })
  },

  // 已预约提示
  showBookedAlter() {
    console.log("showBookedAlter函数执行了");
    wx.showToast({
      title: "该课程已被预约，图中绿色边框课程可预约",
      icon: 'none',
      duration: 3000
    })
  },

  // 未达开放时间提示
  showNotOpenAlert() {
    console.log("showNotOpenAlert函数执行了");
    wx.showToast({
      title: '该课程不在开放时间，图中绿色边框课程可预约',
      icon: 'none',
      duration: 3000
    });
  },

  // 约课响应事件
  async bookCourseTap(e) {
    console.log('bookCourseTap')
    const that=this;
    // 1.2默认登录状态
    // 1.2.1获取点击的课程的日期、开始时间
    let selectCard = this.data.usableCards[this.data.pickerIndex];
    console.log('selectCard', selectCard);
    let date = this.data.date;
    let startHour = this.data.startHour;
    console.log('date', date);
    console.log('startHour', startHour);
    // 1.2.2选中激活卡时，弹窗是否预约的弹窗
    if (selectCard.status === "active") {
      wx.showModal({
        title: '确定要预约吗？',
        content: '注意：最晚2小时取消，临上课2小时内无取消权利',
        showCancel: true,
        cancelText: '取消',
        cancelColor: '#000000',
        confirmText: '确定',
        confirmColor: '#3CC51F',
        success: (result) => {
          // 点击确认之后放置加载框
          if (result.confirm) {
            Toast.loading({
              message: '约课中...',
              duration: 3000,
              forbidClick:true,
              selector: '#van-toast-appointment'
            });
            // 调用预约课程的云函数（还需获取结果）
            wx.cloud.callFunction({
              name: 'bookCourse',
              data: {
                date,
                startHour,
                selectCard
              }
            }).then(res => {
              // 获取预约返回结果，判断是否预约成功
              let { bookResult } = res.result;
              if (bookResult) {
                console.log("预约课程的云函数调用成功", res);
                Toast.success({
                  message:'预约成功',
                  forbidClick:true,
                  duration:5000,
                  selector: '#van-toast-appointment'
                });
                that.refreshData();
              } else {
                console.log("预约课程的云函数调用失败", res);
                Toast.fail({
                  message:'预约失败，不在卡的有效期内',
                  forbidClick:true,
                  selector: '#van-toast-appointment'
                });
              }
            }).catch(err => {
              console.log("预约课程的云函数调用失败", err);
              Toast.fail({
                message:'预约失败',
                forbidClick:true,
                selector: '#van-toast-appointment'
              });
            })
          }
        },
        fail: () => { },
        complete: () => { }
      });
    } else {
      console.log("selectCard.status", selectCard.status);
      // 1.2.3选中未激活卡时，弹窗提示context激活
      wx.showModal({
        title: '确定要预约吗？',
        content: '此卡还未激活，预约后即开始计时！',
        showCancel: true,
        cancelText: '取消',
        cancelColor: '#000000',
        confirmText: '确定',
        confirmColor: '#3CC51F',
        success: (result) => {
          // 点击确认之后放置加载框
          if (result.confirm) {
            Toast.loading({
              message: '约课中...',
              duration: 3000,
              forbidClick:true,
              selector: '#van-toast-appointment'
            });
            // 先通过cardId激活卡【周卡、月卡 处理不同，调用云函数】
            wx.cloud.callFunction({
              name: 'activateCard',
              data: {
                cardId: selectCard.cardId
              }
            }).then(res => {
              console.log("激活卡的云函数调用成功", res);

              // 再调用预约课程的云函数（还需获取结果）
              wx.cloud.callFunction({
                name: 'bookCourse',
                data: {
                  date,
                  startHour,
                  selectCard
                }
              }).then(res => {
                // 获取预约返回结果，判断是否预约成功
                let { bookResult } = res.result;
                if (bookResult) {
                  console.log("预约课程的云函数调用成功", res);
                  Toast.success({
                    message:'预约成功',
                    forbidClick:true,
                    duration:5000,
                    selector: '#van-toast-appointment'
                  });
                  that.refreshData();
                } else {
                  console.log("预约课程的云函数调用失败", res);
                  Toast.fail({
                    message:'预约失败，不在卡的有效期内',
                    forbidClick:true,
                    selector: '#van-toast-appointment'
                  });
                }
              }).catch(err => {
                console.log("预约课程的云函数调用失败", err);
                Toast.fail({
                  message:'预约失败',
                  forbidClick:true,
                  selector: '#van-toast-appointment'
                });
              })
              
            }).catch(err => {
              console.log("激活卡的云函数调用失败", err);
            })
          }
        },
        fail: () => { },
        complete: () => { }
      });
    }
  },

  // 按钮切换事件响应
  onSwitchWeekType() {
    console.log("onSwitchWeekType函数执行了");
    this.setData({
      thisWeekOrNextWeek: !this.data.thisWeekOrNextWeek
    })
  },

  // picker的change事件响应(点击确认会执行)
  onPickerChange(e) {
    console.log("onPickerChange函数执行了");
    console.log(e);
    // 获取dataset
    const { date, startHour } = e.currentTarget.dataset;
    console.log('date', date);
    console.log('startHour', startHour);
    // 设置选择的index
    this.setData({
      pickerIndex: e.detail.value,
      date,
      startHour
    })
    // 预约逻辑
    this.bookCourseTap();
  },

  // picker弹出的响应事件
  onPickerShow(e){
    console.log("onPickerShow");
    // 判断是否有可用卡
    console.log(this.data.usableCardNum);
    if(this.data.usableCardNum === 0){
      Toast.fail({
        message:'没有可用卡',
        selector: '#van-toast-appointment'
      });
    }
  }
})