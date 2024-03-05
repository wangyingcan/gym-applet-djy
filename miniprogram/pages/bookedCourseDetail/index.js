import Toast from '@vant/weapp/toast/toast';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    //bookedCourseNum预约课程数，onload执行完再获取，为零显示空状态
    bookedCourseList: [],//预约课程列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log("onLoad");
    this.refresh();
  },

  onPullDownRefresh() {
    console.log("onPullDownRefresh");
    this.refresh();
  },

  // 刷新方法
  async refresh() {
    console.log("refresh");
    // 获取最新约课数量、约课课程列表
    const { result: { bookedCourseList, bookedCourseNum } } = await wx.cloud.callFunction({
      name: 'getBookedCourseList'
    })
    // list中每个元素加上默认showItem:false属性
    for (let i = 0; i < bookedCourseNum; i++) {
      bookedCourseList[i].showItem = false;
    }
    console.log('bookedCourseList:', bookedCourseList);
    console.log('bookedCourseNum:', bookedCourseNum);
    await this.setData({
      bookedCourseNum,
      bookedCourseList
    })
  },

  // 空状态约课按钮点击事件
  handleClick() {
    console.log('handleTap');
    wx.switchTab({
      url: '/pages/gymAppointment/index'
    })
  },

  // 一级菜单项点击事件
  onClickPowerInfo(e) {
    console.log('onClickPowerInfo');
    const index = e.currentTarget.dataset.index;
    const bookedCourseList = this.data.bookedCourseList;
    const selectedItem = bookedCourseList[index];
    selectedItem.showItem = !selectedItem.showItem;
    this.setData({
      bookedCourseList
    });
  },

  // 取消约课按钮点击事件
  handleCancelCourseClick(e) {
    console.log('handleCancelCourseClick');
    // 0.判断是否在取消约课的允许时间内（距离上课两小时的时候不允许取消约课）
    const nowTime = new Date().getTime();     // 当前时间(毫秒形式)
    let date = e.currentTarget.dataset.date;    // 2024.2.12形式
    let startHour = e.currentTarget.dataset.starthour;    // 18形式
    let cardId=e.currentTarget.dataset.cardId;
    let cardType=e.currentTarget.dataset.cardType;
    let firstBook=e.currentTarget.dataset.firstBook;
    // let type=e.currentTarget.dataset.type;
    // let totalBookCount=e.currentTarget.dataset.totalBookCount;
    console.log("handleCancelCourseClick中所需课程的cardId",cardId);
    console.log("handleCancelCourseClick中所需课程的cardType",cardType);
    console.log("handleCancelCourseClick中所需课程的firstBook",firstBook);
    // 此处获取的是course信息
    // console.log("handleCancelCourseClick中所需课程的type",type);
    // console.log("handleCancelCourseClick中所需课程的totalBookCount",totalBookCount);
    let startYear = date.split('.')[0];
    let startMonth = date.split('.')[1];
    let startDate = date.split('.')[2];
    const startTime = new Date(startYear, startMonth - 1, startDate, startHour, 0, 0).getTime();  // 上课时间(毫秒形式)

    // 1. 周卡处理逻辑不变
    if(cardType == "周卡"){
      if (startTime - nowTime < 2 * 60 * 60 * 1000) {
        wx.showToast({
          title: '距离上课不足两小时，不允许取消预约',
          icon: 'none',
          duration: 2000
        });
        return;
      }

      // 1.显示微信模态框
      wx.showModal({
        title: '确定要取消预约吗？',
        content: '',
        showCancel: true,
        cancelText: '取消',
        cancelColor: '#000000',
        confirmText: '确定',
        confirmColor: '#3CC51F',
        success: (result) => {
          // 1.0 点击确认之后放置加载框
          if (result.confirm) {
            Toast.loading({
              message: '取消约课中...',
              duration: 3000,
            });
            // 1.1调用取消预约的云函数（传入取消预约课程的date、startHour、2小时外）
            wx.cloud.callFunction({
              name: "cancelBookedCourse",
              data: {
                date,
                startHour,
                cardId,
                cardType,
                firstBook,
                isWithinTwoHours:false
              },
            })
          }
        },
        fail: () => { },
        complete: () => { }
      });
    }else{
      // 2.月卡处理逻辑，可以随时取消【2小时内外的提示content有区别】
      // 2.1 2小时之外取消约课，无提示文字
      if(startTime - nowTime >= 1000 * 60 * 60 * 2){
        wx.showModal({
          title:"确认要取消预约吗？",
          content:'',
          showCancel:true,
          cancelText:"取消",
          cancelColor:"#000",
          confirmText:"确认",
          confirmColor:"#3CC51F",
          success:(result)=>{
            // 当用户点击确认时,result代表模态框事件响应成功的响应信息
            if(result.confirm){
              Toast.loading({
                message:"取消约课中...",
                duration:3000
              });

              wx.cloud.callFunction({
                name: "cancelBookedCourse",
                data: {
                  date,
                  startHour,
                  cardId,
                  cardType,
                  firstBook,
                  isWithinTwoHours:false
                },
              })
            }
          },
          fail:()=>{},
          complete:()=>{}
        })
      }else{
        console.log("月卡2小时内取消");
        // 2.2 2小时之内取消约课，关于月卡的提示文字
        wx.showModal({
          title:"确认要取消预约吗？",
          content:'月卡2小时内取消预约，今日不可再约！！！',
          showCancel:true,
          cancelText:"取消",
          cancelColor:"#000",
          confirmText:"确认",
          confirmColor:"#3CC51F",
          success:(result)=>{
            // 当用户点击确认时,result代表模态框事件响应成功的响应信息
            if(result.confirm){
              Toast.loading({
                message:"取消约课中...",
                duration:3000
              });

              wx.cloud.callFunction({
                name: "cancelBookedCourse",
                data: {
                  date,
                  startHour,
                  cardId,
                  cardType,
                  firstBook,
                  isWithinTwoHours:true
                },
              })
            }
          },
          fail:()=>{},
          complete:()=>{}
        })
      }
    }

    // 2.重新获取用户信息
    this.refresh();
  }
})