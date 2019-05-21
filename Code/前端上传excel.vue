<template>
  <div id="detail">
    <!-- 条件筛选 开始 -->
    <div class="select">
      <div class="select-form">
        <div>
          <label for="">选择日期</label>
          <DatePicker v-model="firstDate" type="month" style="width: 150px" :clearable="false" format="yyyy-MM"></DatePicker>
          <label class="until">至</label>
          <DatePicker v-model="expiryDate" type="month" style="width: 150px" :clearable="false"></DatePicker>
           <label class="last-lable">用户类型</label>
          <Select v-model="userSelect" style="width:160px">
            <Option v-for="item in userList" :value="item.value" :key="item.value">{{ item.label }}</Option>
          </Select>
           <label class="last-lable">统计类型</label>
          <Select v-model="statisticsSelect" style="width:160px">
            <Option v-for="item in statisticsList" :value="item.value" :key="item.value">{{ item.label }}</Option>
          </Select>
          <label class="last-lable">统计项目</label>
          <Select v-model="dataType" style="width:160px">
            <Option v-for="item in dataList" :value="item.value" :key="item.value">{{ item.label }}</Option>
          </Select>
        </div>
        <ButtonGroup>
          <Button @click="reset()" type="primary" ghost>重 置</Button>
          <Button type="primary" @click="getAjax">查 询</Button>
        </ButtonGroup>
      </div>

      <div class="btn-group">
        <div>
          (<a href="/template.xlsx" download="导入模板(确保列顺序一致).xlsx">
            下载
            <Icon type="md-download" />
          </a>预设的导入模板)
          <input class="file_inp" ref="file_inp" type="file" @change="importExcel($event.target)">
          <ButtonGroup>
            <Button v-if="btnShow" @click="openFile" type="primary">导 入</Button>
            <Button v-else @click="Import" type="primary" :loading="isLoading">上 传</Button>
            <Button type="primary" :loading="isDerive" @click="derive">导 出</Button>
          </ButtonGroup>
          <span class="last-lable">是否导出扩展数据</span>
          <i-switch v-model="isFlag" />
          <Button style="margin-left:10px;" type="primary" :loading="deriveLoading" @click="deriveAll()">RM业绩导出</Button>
        </div>
      </div>
    </div>
    <!-- 条件筛选 结束 -->
    <!-- 表格 开始 -->
    <header>A数留存报表</header>
    <Table class="result-table" :loading="loading" :columns="tableColumns" :data="tableData" border width="100%"></Table>
    <!-- 表格 结束 -->
    <!-- 图表 开始 -->
    <div id="chart" v-if="ajaxData"></div>
    <!-- 图表 结束 -->
  </div>
</template>
<script lang="ts">
  import XLSX from "xlsx";
  import { renderLineCharts } from "@/charts";
  import chartOption from "@/charts/chartsOptions";
  import { Component, Watch } from "vue-property-decorator";
  import AbpBase from "@/lib/abpbase";
  @Component
  export default class retentionNew extends AbpBase {
    isFlag: boolean = false;
    dataReserve: Array < any > = [];
    excelArr: Array < any >= [];
    deriveLoading: boolean = false;
    isDerive: boolean = false;
    btnShow: boolean = true;
    isLoading: boolean = false;
    loading: boolean = false;
    ajaxData: Array < any > = [];
    /* 筛选区data start */
    firstDate: any = ``;
    expiryDate: any = ``;
    userList: Array < any > = [{
        value: "全部用户",
        label: "全部用户"
      },
      {
        value: "新A用户",
        label: "新A用户"
      },
      {
        value: "回流用户",
        label: "回流用户"
      }
    ];
    userSelect: string = "全部用户";
    statisticsList: Array < any > = [{
        value: "RM用户",
        label: "RM用户"
      },
      {
        value: "非RM用户",
        label: "非RM用户"
      },
      {
        value: "全部用户",
        label: "全部用户"
      }
    ];
    statisticsSelect: string = "RM用户";
    dataList: Array < any > = [{
        value: "留存数",
        label: "留存数"
      },
      {
        value: "留存率",
        label: "留存率"
      },
      {
        value: "平均净入金",
        label: "平均净入金"
      },
      {
        value: "平均总入金",
        label: "平均总入金"
      },
      {
        value: "平均手数",
        label: "平均手数"
      },
      {
        value: "平均出金",
        label: "平均出金"
      }
    ];
    dataType: string = "留存数";
    /* 筛选区data end */

    //表格data
    tableColumns: Array < any > = [{
        title: "用户月份",
        key: "tradeDate",
        align: "center"
      },
      {
        title: "用户总数",
        key: "loginCount",
        align: "center"
      },
      {
        title: "流失月份",
        key: "",
        align: "center",
        children: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
      }
    ];

    //留存数和留存率 转换
    get tableData(): Array < any > {

      switch (this.dataType) {
        case "留存率":
          {
            let newArr: Array < any > = JSON.parse(JSON.stringify(this.dataReserve));
            //留存率 转换方法封装
            let count = (Retention, all) => {
              return `${Retention} (${(Retention / all * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%)`;
            }
            newArr.forEach(item => {
              for (let i = 1; i < 13; i++) {
                if (i < 10) {
                  item[`loginRetentionCount0${i}`] = count(item[`loginRetentionCount0${i}`], item["loginCount"])
                } else {
                  item[`loginRetentionCount${i}`] = count(item[`loginRetentionCount${i}`], item["loginCount"])
                }
              }
            });
            return newArr;
          }
          break;
        case "平均净入金":
          {
            let newArr: Array < any > = JSON.parse(JSON.stringify(this.dataReserve));
            //留存率 转换方法封装
            let count = (num1, num2) => {
              return `${num1} (${num2.toLocaleString(undefined, { maximumFractionDigits: 2 })})`;
            }
            newArr.forEach(item => {
              item["loginCount"] = `${item["loginCount"]}(${item["netProfit"]})`
              for (let i = 1; i < 13; i++) {
                if (i < 10) {
                  item[`loginRetentionCount0${i}`] = count(item[`loginRetentionCount0${i}`], item[`netProfit0${i}`])
                } else {
                  item[`loginRetentionCount${i}`] = count(item[`loginRetentionCount${i}`], item[`netProfit${i}`])
                }
              }
            });
            return newArr;
          }
          break;
        case "平均总入金":
          {
            let newArr: Array < any > = JSON.parse(JSON.stringify(this.dataReserve));
            //留存率 转换方法封装
            let count = (num1, num2) => {
              return `${num1} (${num2.toLocaleString(undefined, { maximumFractionDigits: 2 })})`;
            }
            newArr.forEach(item => {
              item["loginCount"] = `${item["loginCount"]}(${item["inMargin"]})`
              for (let i = 1; i < 13; i++) {
                if (i < 10) {
                  item[`loginRetentionCount0${i}`] = count(item[`loginRetentionCount0${i}`], item[`inMargin0${i}`])
                } else {
                  item[`loginRetentionCount${i}`] = count(item[`loginRetentionCount${i}`], item[`inMargin${i}`])
                }
              }
            });
            return newArr;
          }
          break;
        case "平均手数":
          {
            let newArr: Array < any > = JSON.parse(JSON.stringify(this.dataReserve));
            //留存率 转换方法封装
            let count = (num1, num2) => {
              return `${num1} (${num2.toLocaleString(undefined, { maximumFractionDigits: 2 })})`;
            }
            newArr.forEach(item => {
              item["loginCount"] = `${item["loginCount"]}(${item["lot"]})`
              for (let i = 1; i < 13; i++) {
                if (i < 10) {
                  item[`loginRetentionCount0${i}`] = count(item[`loginRetentionCount0${i}`], item[`lot0${i}`])
                } else {
                  item[`loginRetentionCount${i}`] = count(item[`loginRetentionCount${i}`], item[`lot${i}`])
                }
              }
            });
            return newArr;
          }
          break;
        case "平均出金":
          {
            let newArr: Array < any > = JSON.parse(JSON.stringify(this.dataReserve));
            //留存率 转换方法封装
            let count = (num1, num2) => {
              return `${num1} (${num2.toLocaleString(undefined, { maximumFractionDigits: 2 })})`;
            }
            newArr.forEach(item => {
              item["loginCount"] = `${item["loginCount"]}(${item["outMargin"]})`
              for (let i = 1; i < 13; i++) {
                if (i < 10) {
                  item[`loginRetentionCount0${i}`] = count(item[`loginRetentionCount0${i}`], item[`outMargin0${i}`])
                } else {
                  item[`loginRetentionCount${i}`] = count(item[`loginRetentionCount${i}`], item[`outMargin${i}`])
                }
              }
            });
            return newArr;
          }
          break;
        case "留存数":
          return this.ajaxData;
          break;
        default:
          return null;
          break;
      }
    }

    //导出RM业绩
    deriveAll() {
      this.deriveLoading = true;
      this.$store
        .dispatch({
          type: "persist/postDeriveAll",
          sourceID: this.$store.state.session.sourceID,
          IsFlag: this.isFlag,
        })
        .then(res => {
          window.location.href = window.URL.createObjectURL(res.data);
          this.deriveLoading = false;
        }).catch(err => {
          this.deriveLoading = false;
        });
    }
    //导出
    derive() {
      let AccountType: any = "";
      switch (this.userSelect) {
        case `全部用户`:
          AccountType = "";
          break;
        case `新A用户`:
          AccountType = 1;
          break;
        case `回流用户`:
          AccountType = 0;
          break;
      }
      let StatisticalType: any = "";
      switch (this.statisticsSelect) {
        case `全部用户`:
          StatisticalType = "";
          break;
        case `RM用户`:
          StatisticalType = 0;
          break;
        case `非RM用户`:
          StatisticalType = 1;
          break;
      }
      let DataType: number = 0;
      switch (this.dataType) {
        case `留存率`:
          DataType = 1;
          break;
        case `留存数`:
          DataType = 0;
          break;
        default:
          DataType = 0;
          break;
      }
      let firstMonth =
        this.firstDate.getMonth() < 9 ?
        `0${this.firstDate.getMonth() + 1}` :
        `${this.firstDate.getMonth() + 1}`;
      let expiryMonth =
        this.expiryDate.getMonth() < 9 ?
        `0${this.expiryDate.getMonth() + 1}` :
        `${this.expiryDate.getMonth() + 1}`;
      this.isDerive = true;
      this.$store
        .dispatch({
          type: "persist/postDerive",
          StartMonth: `${this.firstDate.getFullYear()}-${firstMonth}`,
          EndMonth: `${this.expiryDate.getFullYear()}-${expiryMonth}`,
          AccountType,
          StatisticalType,
          DataType,
          sourceID: this.$store.state.session.sourceID,
        })
        .then(res => {
          window.location.href = window.URL.createObjectURL(res.data);
          this.isDerive = false;
        }).catch(err => {
          this.isDerive = false;
        });
    }
    //点击按钮 打开input[file]
    openFile() {
      let el: any = this.$refs.file_inp;
      el.click();
    }
    //导入excel 变异为数组
    importExcel(obj) {
      let self = this;
      if (!obj.files) {
        return;
      }
      let file = obj.files[0],
        types = file.name.split(".")[1],
        fileType = ["xlsx", "xlc", "xlm", "xls", "xlt", "xlw", "csv"].some(
          item => item === types
        );
      if (!fileType) {
        this.$Message.error("格式错误！请重新选择");
        return;
      }
      var reader = new FileReader();
      reader.onload = function(e: any) {
        var data = e.target.result;
        var workbook = XLSX.read(data, { type: "binary" });
        self.excelArr = XLSX.utils.sheet_to_json(
          workbook.Sheets[workbook.SheetNames[0]], { header: ['login', 'accountName', 'accountManager', 'accountOpeningTime', 'firstTime', 'contacts', 'repeatingObjects', 'friendFlag', 'friendTime', 'netHierarchy', 'dataSources', 'checkDigi', 'uniqueness', ], raw: false, }
        )
        // self.excelArr.shift();
        obj.value = null;
        self.btnShow = false;
      };
      reader.readAsBinaryString(file);
    }
    //excel变异后的数组传给后端
    Import() {
      this.isLoading = false;
      let dataBoolean: boolean = true;
      let reg = /^\d+$/;
      for (let i = 0; i < this.excelArr.length; i++) {
        this.excelArr[i].RowId = i;
        if (i == 0) {
          this.excelArr[i].accountManager = this.excelArr[i].accountManager ? `AccountManager|${this.excelArr[i].accountManager}` : null;
          this.excelArr[i].accountName = this.excelArr[i].accountName ? `AccountName|${this.excelArr[i].accountName}` : null;
          this.excelArr[i].accountOpeningTime = this.excelArr[i].accountOpeningTime ? `AccountOpeningTime|${this.excelArr[i].accountOpeningTime}` : null;
          this.excelArr[i].checkDigi = this.excelArr[i].checkDigi ? `CheckDigi|${this.excelArr[i].checkDigi}` : null;
          this.excelArr[i].contacts = this.excelArr[i].contacts ? `Contacts|${this.excelArr[i].contacts}` : null;
          this.excelArr[i].dataSources = this.excelArr[i].dataSources ? `DataSources|${this.excelArr[i].dataSources}` : null;
          this.excelArr[i].firstTime = this.excelArr[i].firstTime ? `FirstTime|${this.excelArr[i].firstTime}` : null;
          this.excelArr[i].friendFlag = this.excelArr[i].friendFlag ? `FriendFlag|${this.excelArr[i].friendFlag}` : null;
          this.excelArr[i].friendTime = this.excelArr[i].friendTime ? `FriendTime|${this.excelArr[i].friendTime}` : null;
          this.excelArr[i].login = this.excelArr[i].login ? `Login|${this.excelArr[i].login}` : null;
          this.excelArr[i].netHierarchy = this.excelArr[i].netHierarchy ? `NetHierarchy|${this.excelArr[i].netHierarchy}` : null;
          this.excelArr[i].repeatingObjects = this.excelArr[i].repeatingObjects ? `RepeatingObjects|${this.excelArr[i].repeatingObjects}` : null;
          this.excelArr[i].uniqueness = this.excelArr[i].uniqueness ? `Uniqueness|${this.excelArr[i].uniqueness}` : null;
        } else {
          if (reg.test(this.excelArr[i].login) == false) {
            this.$Notice.error({
              title: `第${i+2}行：账号不能为空且必须为数字`,
            });
            dataBoolean = false;
            break;
          }
        }

      }
      if (false == dataBoolean) {
        this.btnShow = true;
        return;
      }
      this.isLoading = true;
      this.$store
        .dispatch({
          type: "persist/postImport",
          data: {
            rMCustomerCares: this.excelArr,
            sourceID: this.$store.state.session.sourceID
          }
        })
        .then(res => {
          this.btnShow = true;
          this.isLoading = false;
          if (res.data.result == null) {
            this.$Message.success("导入成功！");
            this.$Message.warning({
              content: `后台最新数据生成中...请稍后再使用“查询”和“导出”功能`,
              closable: true,
              duration: 5
            });
          } else {
            let errArr = res.data.result;
            errArr.forEach(element => {
              this.$Notice.error({
                title: `账号${element.login}：${element.errorMessage}`
              });
            });
          }
        }).catch(err => {
          this.btnShow = true;
          this.isLoading = false;
        });
    }
    //重置筛选条件并请求接口
    reset() {
      this.expiryDate = new Date();
      this.firstDate = new Date(
        this.expiryDate.getFullYear() - 1,
        this.expiryDate.getMonth()
      );
      [this.userSelect, this.statisticsSelect, this.dataType] = [
        "全部用户",
        "全部用户",
        "留存数"
      ];
      this.getAjax();
    }
    //设置图表
    setEcharts() {
      let option = Object.assign({}, chartOption.lineChartsOption);
      let arr = [];
      [option.title.text, option.xAxis[0].data] = [
        "RM留存数",
        ["RM总用户", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      ];
      this.dataReserve.forEach((item, index) => {
        option.legend.data.push(item.tradeDate);
        arr.push({
          name: item.tradeDate,
          type: "line",
          data: [
            item.loginCount,
            item.loginRetentionCount01,
            item.loginRetentionCount02,
            item.loginRetentionCount03,
            item.loginRetentionCount04,
            item.loginRetentionCount05,
            item.loginRetentionCount06,
            item.loginRetentionCount07,
            item.loginRetentionCount08,
            item.loginRetentionCount09,
            item.loginRetentionCount10,
            item.loginRetentionCount11,
            item.loginRetentionCount12
          ]
        });
      });
      option.series = arr;
      new renderLineCharts(option).renderCharts("chart");
    }
    //请求报表数据接口
    getAjax() {
      this.loading = true;
      let userType: any = "";
      switch (this.userSelect) {
        case `全部用户`:
          userType = "";
          break;
        case `新A用户`:
          userType = 1;
          break;
        case `回流用户`:
          userType = 0;
          break;
      }
      let statisticalType: any;
      switch (this.statisticsSelect) {
        case `全部用户`:
          statisticalType = "";
          break;
        case `RM用户`:
          statisticalType = 0;
          break;
        case `非RM用户`:
          statisticalType = 1;
          break;
      }
      let firstMonth =
        this.firstDate.getMonth() < 9 ?
        `0${this.firstDate.getMonth() + 1}` :
        `${this.firstDate.getMonth() + 1}`;
      let expiryMonth =
        this.expiryDate.getMonth() < 9 ?
        `0${this.expiryDate.getMonth() + 1}` :
        `${this.expiryDate.getMonth() + 1}`;
      this.$store
        .dispatch({
          type: "persist/getNew",
          params: {
            StartMonth: `${this.firstDate.getFullYear()}-${firstMonth}`,
            EndMonth: `${this.expiryDate.getFullYear()}-${expiryMonth}`,
            AccountType: userType,
            StatisticalType: statisticalType,
            sourceID: this.$store.state.session.sourceID,
          }
        })
        .then(res => {
          this.dataReserve = res.data.result;
          let printf = (val) => {
            return (val).toLocaleString(undefined, { maximumFractionDigits: 2 })
          }
          this.ajaxData = JSON.parse(JSON.stringify(this.dataReserve));
          this.ajaxData.forEach(item => {
            item.loginCount = printf(item.loginCount);
            item.loginRetentionCount01 = printf(item.loginRetentionCount01);
            item.loginRetentionCount02 = printf(item.loginRetentionCount02);
            item.loginRetentionCount03 = printf(item.loginRetentionCount03);
            item.loginRetentionCount04 = printf(item.loginRetentionCount04);
            item.loginRetentionCount05 = printf(item.loginRetentionCount05);
            item.loginRetentionCount06 = printf(item.loginRetentionCount06);
            item.loginRetentionCount07 = printf(item.loginRetentionCount07);
            item.loginRetentionCount08 = printf(item.loginRetentionCount08);
            item.loginRetentionCount09 = printf(item.loginRetentionCount09);
            item.loginRetentionCount10 = printf(item.loginRetentionCount10);
            item.loginRetentionCount11 = printf(item.loginRetentionCount11);
            item.loginRetentionCount12 = printf(item.loginRetentionCount12);
          })
          this.loading = false;
          this.setEcharts();
        })
    }
    created() {
      //表格th"流失月份"的子th 生成
      this.tableColumns[2].children.map((item, index) => {
        Object.assign(item, {
          title: index + 1,
          align: "center",
          key: index < 9 ?
            `loginRetentionCount0${index + 1}` : `loginRetentionCount${index + 1}`
        });
      });
      this.reset();
    }
    //监听切换平台，重新请求接口数据
    @Watch("$store.state.session.sourceID")
    changeSourceID(newV) {
      this.getAjax();
    }
  }
</script>

<style lang="less">
  @import "./retentionNew.less";
</style>