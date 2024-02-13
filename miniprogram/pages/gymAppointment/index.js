import Toast from '@vant/weapp/toast/toast';
// 0.引入数据库
const db=wx.cloud.database();
// 1.获取集合
const courseTable =db.collection('CourseTable');
// 2.设置本周课程缓存、下周课程缓存
const thisWeekCourseCacheKey = 'thisWeekCourses';
const nextWeekCourseCacheKey = 'nextWeekCourses';




Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 是否允许切换下一周(是否到了周五22点、是否到了周日22点)   
    showNextWeek: false, 
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
    monthIndexText: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', ],// index和月份汉字映射
    weekDayCount: 7,// 一周的天数
    // 这一周的日期数组（12）
    thisWeekDates:[],
    // 下一周的日期数组（2024.2.19）
    nextWeekDates:[],
    // 下一周的年份nextYear
    // 下一周的月份nextMonth
    // 下一周的起始日期nextStartDay
    // 下一周的终止日期nextEndDay
    // 下一周的日期数组（19）
    nextWeekDates1:[],
    // 这一周的课程真实数据
    courseList:[],
    // 下一周的课程真实数据
    nextWeekCourseList:[],
    // 是否是第一次进入
    firstEntry:true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let that=this;
    // 0.获取系统宽度，由于给课程块定位
    const {windowWidth} =wx.getSystemInfoSync()
    this.setData({
      windowWidth,
      thisWeekOrNextWeek:true,
    })
    this.refreshData().then(() => {
      // 1.更新完之后就可以设置firstEntry了
      that.setData({
        firstEntry:false
      })
    });
  },
  
  onShow() {
    this.refreshData();
  },

  // 刷新按钮点击事件
  refresh(e){
    const toast = Toast.loading({
      duration: 0, // 持续展示 toast
      forbidClick: true,
      message: '倒计时 3 秒',
      selector: '#custom-selector',
    });
    
    let second = 3;
    const timer = setInterval(() => {
      second--;
      if (second) {
        toast.setData({
          message: `倒计时 ${second} 秒`,
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
    // 0.周五22点到周日22点内showNextWeek为true,否则为false（numOfWeek有星期信息，new Date().getHours()有小时信息）
    const numOfWeek = this.data.numOfWeek;
    const nowHour = new Date().getHours();
    // 0.1.周五22点之后，周六，周日22点之前
    if((numOfWeek==5&&nowHour>=22)||(numOfWeek==6)||(numOfWeek==0&&nowHour<22)){
      this.setData({
        showNextWeek:true
      })
    }else{ 
      this.setData({
        showNextWeek:false
      })
    }

    // 1.获取今天的日期，同时会调用getTodayMoreInfo函数，获取更多信息
    this.getToday();
    // 2.去除本地缓存
    wx.removeStorageSync(thisWeekCourseCacheKey);
    wx.removeStorageSync(nextWeekCourseCacheKey);
    // 3.获取这两周的课程信息
    return this.getData();
  },

  // 0.获取课程信息
  async getData(){
    if(this.data.firstEntry){     //请注意写法
      // 显示加载提示
      wx.showLoading({
        title: '努力加载课程...',
      });
    }
    // 0.0.获取缓存
    const thisWeekCourses = wx.getStorageSync(thisWeekCourseCacheKey);
    const nextWeekCourses = wx.getStorageSync(nextWeekCourseCacheKey);
    // 0.0.1如果有缓存就直接使用
    if(thisWeekCourses && nextWeekCourses){
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
    console.log(thisWeekDates);
    console.log(nextWeekDates);
    // 0.3.获取这周的课程信息
    let courseList = [];    // 初始化数组
    for(let i=0;i<7;i++){
      await courseTable.where({
        date:thisWeekDates[i]
      }).get().then(res=>{
        console.log(res.data);
        if(res.data.length>0){
          courseList.push(res.data[0]);
        }
      })
    }
    //设置缓存
    try{
      wx.setStorageSync(thisWeekCourseCacheKey,courseList); 
    }catch(e){

    }
    // 0.4.获取下一周的课程信息
    let nextWeekCourseList=[];    // 初始化数组
    for(let i=0;i<7;i++){
      await courseTable.where({
        date:nextWeekDates[i]
      }).get().then(res=>{
        console.log(res.data);
        if(res.data.length>0){
          nextWeekCourseList.push(res.data[0]);
        }
      })
    }
    //设置缓存
    try{
      wx.setStorageSync(nextWeekCourseCacheKey,nextWeekCourseList);
    }catch(e){
      
    }
    // 隐藏加载提示
    wx.hideLoading();
    if(!this.data.firstEntry){
      wx.showToast({
        title: '更新成功',
        icon: "success"
      })
    }
    // 0.5.更新数据
    this.setData({
      courseList,
      nextWeekCourseList
    })
  },

  // 1.获取今天的日期
  getToday() {
    // 1.1获取此刻的Date对象
    const date = new Date('2024-2-24 00:25:00');
    // 1.2转换为today格式
    const todayStr = date.getFullYear() + '.' + (date.getMonth() + 1) + '.' + date.getDate();
    console.log("today : "+todayStr);
    // 1.3更新today
    this.setData({
      today:todayStr,
      year:date.getFullYear(),
      day:date.getDate(),
      numOfWeek:date.getDay()
    })
    // 1.4解析今天信息获取更多数据
    this.getTodayMoreInfo(date.getFullYear(),date.getMonth(),date.getDate())
  },

  // 获取一周的日期
  getWeekDates(startDayOfWeek) {
    let nowWeekDates = [];    // 初始化数组(12)
    let thisWeekDates = [];    // 初始化数组(2024.2.12)
    let nextWeekDates = [];    // 初始化数组(2024.2.19)
    for(let i = 0; i < 7; i++){   // 遍历获取一周日期
      const iDate = new Date(startDayOfWeek.getTime() + i * 1000 * 60 * 60 * 24);
      nowWeekDates.push(iDate.getDate());
      thisWeekDates.push(iDate.getFullYear() + '.' + (iDate.getMonth() + 1) + '.' + iDate.getDate());
      const jDate = new Date(startDayOfWeek.getTime() + (i + 7) * 1000 * 60 * 60 * 24);
      nextWeekDates.push(jDate.getFullYear() + '.' + (jDate.getMonth() + 1) + '.' + jDate.getDate());
    }
    // 获取下一周的年份
    let nextYear=nextWeekDates[0].split('.')[0];
    console.log(nextYear);
    // 获取下一周的月份
    let nextMonth=nextWeekDates[0].split('.')[1];
    console.log(nextMonth);
    // 获取下一周的起始日期
    let nextStartDay=nextWeekDates[0].split('.')[1]+'.'+nextWeekDates[0].split('.')[2];
    console.log(nextStartDay);
    // 获取下一周的终止日期
    let nextEndDay=nextWeekDates[6].split('.')[1]+'.'+nextWeekDates[6].split('.')[2];
    console.log(nextEndDay);
    // 获取下一周的日期数组
    let nextWeekDates1=[];
    for(let i=0;i<7;i++){
      nextWeekDates1.push(nextWeekDates[i].split('.')[2]);
    }
    return [nowWeekDates, thisWeekDates, nextWeekDates,nextYear,nextMonth,nextStartDay,nextEndDay,nextWeekDates1];
  },

  // 2.将今天的日期解析出更多信息（本周始终日期、本周日期数组、本周年月日数组、下周年月日数组）
  getTodayMoreInfo(year,month,day){
    // 2.1获取今天信息
    const dayOfWeek=new Date(year,month,day).getDay();// 星期(1开头代表周一、0代表周日)

    // 2.2获取此周的起始日期、终止日期、每天日期
    let startDayOfWeekTime, endDayOfWeekTime, startDayOfWeek, endDayOfWeek, startDay, endDay;
    if(dayOfWeek == 1){
      // 今天周一时
      console.log("周一");
      startDayOfWeekTime = new Date(year, month, day).getTime();    // 起始日期（毫秒数）
      endDayOfWeekTime = startDayOfWeekTime + 1000 * 60 * 60 * 24 * 6;    // 终止日期（毫秒数）
    } else if(dayOfWeek == 0){
      // 今天周日时
      console.log("周日");
      endDayOfWeekTime = new Date(year, month, day).getTime();
      startDayOfWeekTime = endDayOfWeekTime - 1000 * 60 * 60 * 24 * 6; 
    } else {
      // 周中时
      console.log("今天周" + dayOfWeek);
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
    console.log(startDay);
    console.log(endDay);

    let [nowWeekDates, thisWeekDates,nextWeekDates,nextYear,nextMonth,nextStartDay,nextEndDay,nextWeekDates1] = this.getWeekDates(startDayOfWeek);

    // 验证通过
    console.log(nowWeekDates);
    console.log(thisWeekDates);
    console.log(nextWeekDates);
    console.log(nextWeekDates1);

    // 设置所有数据
    this.setData({
      startDay: startDay,
      endDay: endDay,
      month: startDayOfWeek.getMonth() + 1,
      nowWeekDates: nowWeekDates,
      thisWeekDates: thisWeekDates,
      nextWeekDates: nextWeekDates,
      nextYear:nextYear,
      nextMonth:nextMonth,
      nextStartDay:nextStartDay,
      nextEndDay:nextEndDay,
      nextWeekDates1:nextWeekDates1
    })
  },

  // 已预约提示
  showBookedAlter(){
    wx.showToast({
      title:"该课程已被预约，图中绿色边框课程可预约",
      icon:'none',
      duration:3000
    })
  },

  // 未达开放时间提示
  showNotOpenAlert() {
    wx.showToast({
      title: '该课程不在开放时间，图中绿色边框课程可预约',
      icon: 'none',
      duration: 3000
    });
  },

  // 按钮切换事件响应
  onSwitchWeekType(){
    this.setData({
      thisWeekOrNextWeek:!this.data.thisWeekOrNextWeek
    })
  },
})