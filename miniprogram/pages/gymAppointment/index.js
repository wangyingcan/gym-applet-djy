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
    // 这一周的日期数组
    thisWeekDates:[],
    // 下一周的日期数组
    nextWeekDates:[],
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
      windowWidth
    })
    this.refreshData().then(() => {
      // 1.更新完之后就可以设置firstEntry了
      that.setData({
        firstEntry:false
      })
    });

    // 2.设置每小时更新的定时器
    setInterval(this.updateCourseStatus,60*60*1000)
  },
  
  onShow() {
    this.refreshData();
  },

  // 刷新按钮点击事件
  refresh(e){
    this.refreshData()
  },
  
  // 刷新：清缓存、加载数据库数据
  refreshData() {
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
    const date = new Date();
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
    let nowWeekDates = [];    // 初始化数组
    let thisWeekDates = [];    // 初始化数组(2024.2.12)
    let nextWeekDates = [];    // 初始化数组(2024.2.19)
    for(let i = 0; i < 7; i++){   // 遍历获取一周日期
      const iDate = new Date(startDayOfWeek.getTime() + i * 1000 * 60 * 60 * 24);
      nowWeekDates.push(iDate.getDate());
      thisWeekDates.push(iDate.getFullYear() + '.' + (iDate.getMonth() + 1) + '.' + iDate.getDate());
      const jDate = new Date(startDayOfWeek.getTime() + (i + 7) * 1000 * 60 * 60 * 24);
      nextWeekDates.push(jDate.getFullYear() + '.' + (jDate.getMonth() + 1) + '.' + jDate.getDate());
    }
    return [nowWeekDates, thisWeekDates, nextWeekDates];
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

    let [nowWeekDates, thisWeekDates,nextWeekDates] = this.getWeekDates(startDayOfWeek);

    // 验证通过
    console.log(nowWeekDates);
    console.log(thisWeekDates);
    console.log(nextWeekDates);

    // 设置所有数据
    this.setData({
      startDay: startDay,
      endDay: endDay,
      month: startDayOfWeek.getMonth() + 1,
      nowWeekDates: nowWeekDates,
      thisWeekDates: thisWeekDates,
      nextWeekDates: nextWeekDates,
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

  // 小时定时器
  updateCourseStatus(){
    // 1.获取当前的星期、小时
    const now = new Date();
    const numOfWeek = this.data.numOfWeek;
    const nowHour = now.getHours();
    // 默认最初始的时候，是周一，周二数据正常，周三之后数据status默认是3
    // 2.每小时对当天课程的逻辑：同一天的课程（index+numOfWeek【注意周日】控制）当前小时（nowHour）如果超过 startHour+courseLength，将课程status改为3，写入数据库
    // 2.1获取courseTable中当天数据
    courseTable.where({
      date:this.data.today
    }).get().then(res=>{
      // 2.2打印今天课程数据
      console.log(res.data);
      if(res.data.length>0){
        // 2.3遍历课程数据
        let courses = res.data[0].courses;
        for(let i=0;i<courses.length;i++){
          let course = courses[i];
          // 2.4状态非3的可能就要进行状态更新
          if(course.status !== 3){
            // 2.5判断是否超时
            if(course.startHour + course.courseLength <= nowHour){
              course.status = 3;
            }
          }
        }
        // 2.6更新数据库
        courseTable.doc(res.data[0]._id).update({
          data:{
            courses
          }
        }).then(res=>{
          console.log('更新成功',res)
        }).catch(err=>{
          console.log('更新失败',err)
        })
      }
    })

    // 3.周一~周四 22点时的逻辑：将后天的课程status改为1，写入数据库
    // 3.1判断是否是周一~周四
    if(numOfWeek>=1&&numOfWeek<=4){
      // 3.2判断是否已经到了22点
      if(nowHour==22){
        // 3.3获取后天的日期
        const afterTomorrow = this.data.thisWeekDates[numOfWeek+1];
        // 3.4获取后天的课程
        courseTable.where({
          date:afterTomorrow
        }).get().then(res=>{
          // 3.5打印后天课程数据
          console.log(res.data);
          if(res.data.length>0){
            // 3.6遍历课程数据
            let courses = res.data[0].courses;
            for(let i=0;i<courses.length;i++){
              let course = courses[i];
              // 3.7所有课程状态设置为1
              course.status = 1;
            }
            // 3.8更新数据库
            courseTable.doc(res.data[0]._id).update({
              data:{
                courses
              }
            }).then(res=>{
              console.log('更新成功',res)
            }).catch(err=>{
              console.log('更新失败',err)
            })
          }
        
        })
      }
    }

    // 4.周五 22点时的逻辑：将周日、下周一、二的课程status改为1，写入数据库；开放”切换下一周“按钮
    // 4.1判断是否是周五
    if(numOfWeek==5){
      // 4.2判断是否已经到了22点
      if(nowHour==22){
        // 4.3获取周日、下周一、二的日期
        const sunday = this.data.thisWeekDates[6];
        const nextMonday = this.data.nextWeekDates[0];
        const nextTuesday = this.data.nextWeekDates[1];
        // 4.4获取周日、下周一、二的课程
        courseTable.where({
          date:sunday
        }).get().then(res=>{
          // 4.5打印周日课程数据
          console.log(res.data);
          if(res.data.length>0){
            // 4.6遍历课程数据
            let courses = res.data[0].courses;
            for(let i=0;i<courses.length;i++){
              let course = courses[i];
              // 4.7所有课程状态设置为1
              course.status = 1;
            }
            // 4.8更新数据库
            courseTable.doc(res.data[0]._id).update({
              data:{
                courses
              }
            }).then(res=>{
              console.log('更新成功',res)
            }).catch(err=>{
              console.log('更新失败',err)
            })
          }
        })
        courseTable.where({
          date:nextMonday
        }).get().then(res=>{
          // 4.9打印下周一课程数据
          console.log(res.data);
          if(res.data.length>0){
            // 4.10遍历课程数据
            let courses = res.data[0].courses;
            for(let i=0;i<courses.length;i++){
              let course = courses[i];
              // 4.11所有课程状态设置为1
              course.status = 1;
            }
            // 4.12更新数据库
            courseTable.doc(res.data[0]._id).update({
              data:{
                courses
              }
            }).then(res=>{
              console.log('更新成功',res)
            }).catch(err=>{
              console.log('更新失败',err)
            })
          }
        })
        courseTable.where({
          date:nextTuesday
        }).get().then(res=>{
          // 4.13打印下周二课程数据
          console.log(res.data);
          if(res.data.length>0){
            // 4.14遍历课程数据
            let courses = res.data[0].courses;
            for(let i=0;i<courses.length;i++){
              let course = courses[i];
              // 4.11所有课程状态设置为1
              course.status = 1;
            }
            // 4.12更新数据库
            courseTable.doc(res.data[0]._id).update({
              data:{
                courses
              }
            }).then(res=>{
              console.log('更新成功',res)
            }).catch(err=>{
              console.log('更新失败',err)
            })
          }
        })
      }

      // 4.15开放”切换下一周“按钮
      this.setData({
        showNextWeek:true
      })
    }

    // 5.周六 22点时的逻辑：不更新

    // 6.周日 22点时的逻辑: 关闭”切换下一周“按钮
    if(numOfWeek==6){
      if(nowHour==22){
        this.setData({
          showNextWeek:false
        })
      }
    }

    // 7.刷新页面
    this.refreshData();
  }

  
})