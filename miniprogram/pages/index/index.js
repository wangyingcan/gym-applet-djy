// index.js
// const app = getApp()

// 1. 引入环境列表，此处使用JS的导入导出语法，环境作为全局变量
const { envList } = require('../../envList.js');

// // 0.1 创建实例环境
// const a = new wx.cloud.Cloud({
//     resourceEnv:"dev-3g5cl9ca65d64f4b",
//     traceUser:true
// });

// // 0.2 初始化环境变量
// a.init();

Page({
  // 2. 设置页面的初始数据
  data: {
    showUploadTip: false,   
    powerList: [{
      title: '云函数',
      tip: '安全、免鉴权运行业务代码',
      showItem: false,
      item: [{
        title: '获取OpenId',
        page: 'getOpenId'
      },
      //  {
      //   title: '微信支付'
      // },
       {
        title: '生成小程序码',
        page: 'getMiniProgramCode'
      },
      // {
      //   title: '发送订阅消息',
      // }
    ]
    }, {
      title: '数据库',
      tip: '安全稳定的文档型数据库',
      showItem: false,
      item: [{
        title: '创建集合',
        page: 'createCollection'
      }, {
        title: '更新记录',
        page: 'updateRecord'
      }, {
        title: '查询记录',
        page: 'selectRecord'
      }, {
        title: '聚合操作',
        page: 'sumRecord'
      }]
    }, {
      title: '云存储',
      tip: '自带CDN加速文件存储',
      showItem: false,
      item: [{
        title: '上传文件',
        page: 'uploadFile'
      }]
    }, {
      title: '云后台',
      tip: '开箱即用的小程序后台管理系统',
      tag: 'new',
      page: 'cloudBackend',
    }, {
      title: '单页模板2.0',
      tip: '基于页面模板，快速配置、搭建小程序页面',
      tag: 'new',
      page: 'singleTemplate',
    }, {
      title: '云托管',
      tip: '不限语言的全托管容器服务',
      link: 'https://cloud.weixin.qq.com/cloudrun',
    }],
    envList,
    selectedEnv: envList[0],
    haveCreateCollection: false
  },

  // 3. 列表渲染视图区唯一且统一的点击事件（内部组件只要点击就可以触发）
  onClickPowerInfo(e) {
    // 3.1 获取点击的索引，并找到对应列表项数据
    const index = e.currentTarget.dataset.index;
    const powerList = this.data.powerList;
    const selectedItem = powerList[index];
    // 3.2 切换展示状态
    selectedItem.showItem = !selectedItem.showItem;
    // 3.3 根据powerlist中触发事件的列表项属性，进行对应的操作（非最低级【二级】列表项不会存在下列属性）
    if (selectedItem.link) {
      // 3.3.1 存在link属性时，跳转到web文件夹对应页面（此处可传入参数）
      wx.navigateTo({
        url: `../web/index?url=${selectedItem.link}&title=${selectedItem.title}`,
      });
    } else if (selectedItem.page) {
      // 3.3.2 存在page属性时，重定向到指定页面
      wx.navigateTo({
        url: `/pages/${selectedItem.page}/index`,
      });
    } else if (selectedItem.title === '数据库' && !this.data.haveCreateCollection) {
      // 3.3.3 点击“数据库”一级列表  &&  没有创建集合
      this.onClickDatabase(powerList);
    } else {
      // 3.3.4 其他情况，只需设置powerList
      this.setData({
        powerList
      });
    }
  },

  // 5. 选择云环境
  onChangeShowEnvChoose() {
    // 5.1 调用微信小程序API wx.showActionSheet({itemList: ,success: ,fail:})展示环境选择列表
    wx.showActionSheet({
      // 5.1.1 itemList是一个数组，包含了所有环境的alias
      itemList: this.data.envList.map(i => i.alias),
      // 5.1.2 success是选择成功后的回调函数，res返回选择列表项的信息
      success: (res) => {
        this.onChangeSelectedEnv(res.tapIndex);
      },
      // 5.1.3 fail是选择失败后的回调函数，res返回失败信息
      fail (res) {
        console.log(res.errMsg);
      }
    });
  },

  // 6. 切换云环境的响应函数
  onChangeSelectedEnv(index) {
    // 6.1 切换云环境时，如果选择的环境与当前环境相同，则不进行任何操作
    if (this.data.selectedEnv.envId === this.data.envList[index].envId) {
      return;
    }
    // 6.2 切换云环境时，将powerList中所有的showItem属性设置为false
    const powerList = this.data.powerList;
    powerList.forEach(i => {
      i.showItem = false;
    });
    // 6.3 切换云环境时，设置最新的selectedEnv、powerList、haveCreateCollection
    this.setData({
      selectedEnv: this.data.envList[index],
      powerList,
      haveCreateCollection: false
    });
  },

  // 7. 子列表项点击之后跳转到pages下的对应页面
  jumpPage(e) {
    wx.navigateTo({
      url: `/pages/${e.currentTarget.dataset.page}/index?envId=${this.data.selectedEnv.envId}`,
    });
  },

  // 4. ”数据库“列表项组件点击事件响应函数
  onClickDatabase(powerList) {
    // 4.1 显示加载提示wx.showLoading({title: ,icon: ,mask: })
    wx.showLoading({
      title: '',
    });

    // 4.2 调用云函数创建数据库集合（collection）wx.cloud.callFunction({name: ,data: ,})
    wx.cloud.callFunction({
      // 4.2.1 云函数名称 name
      name: 'quickstartFunctions',
      // 4.2.2 云函数配置信息 config（此处是云环境）
      config: {
        env: this.data.selectedEnv.envId    // envList[0].envId是此处的实际赋值,在顶部引入的envList.js中有envList的定义，对应一个存储云开发envId的数组
      },
      // 4.2.3 云函数请求参数 data（此处是操作类型）
      data: {
        type: 'createCollection'
      }
    }).
    // 4.3 云函数调用成功后，Promise类型回调函数
    then((resp) => {    //resp是云函数返回的结果，本质上是一个对象
      if (resp.result.success) {    //result.success是返回结果对象内的字段
        // 4.3.1 创建集合成功后，设置haveCreateCollection为true
        this.setData({
          haveCreateCollection: true
        });
      }
      // 4.3.2 无论创建集合成功与否，都要设置最新powerList、关闭加载提示
      this.setData({
        powerList
      });
      wx.hideLoading();
    }).
    // 4.4 云函数调用失败后，Promise类型回调函数
    catch((e) => {
      // 4.4.1 云函数调用失败，设置showUploadTip为true（显示上传提示）
      console.log(e);
      // 4.4.2 设置提示框显示
      this.setData({
        showUploadTip: true   // 底部会弹出  要求执行“上传云函数”脚本的  提示
      });
      // 4.4.3 关闭加载提示
      wx.hideLoading();
    });
  }
});
