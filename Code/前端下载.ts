import XLSX from "xlsx";
export default class financialDitail extends AbpBase {
    @Prop(Number) companyId!: number; //平台ID
    @Prop(String) companyName!: string; //平台名字
    @Prop(Array) billingData!: Array<any>; //计费
    test(SLlist, cPercent) {
        let maxVal = 100;
        for (let item of SLlist) {
            maxVal -= item.costPercent;
        }
        maxVal += cPercent;
        return maxVal;
    }
    serviceLineList: any[] = [{}];
    hasServiceLine: boolean = true;
    isReady: boolean = false;
    value11: any = 0;
    businessLine: boolean = false;
    isShow: boolean = true;
    isEdit: boolean = true;
    isSubmit: boolean = false;
    changedData: any = {};
    originalData: any = {};
    //筛选日期初始化
    selectDate: any = "";
    //导出excel的源数组初始化
    excelArr: any[] = [];
    allArr: any[] = [];
    Json: any[] = [];
    //修改成本分配
    //包含数字的数组求和
    _summation(arr) {
        return arr.reduce((acc, cur) => acc + cur);
    }
    //ajax请求已选时间节点的年度汇总并且导出为excel
    getTotalData() {
        this.$store
            .dispatch({
                type: "run/GET_Year_Total",
                params: {
                    issueYear: this.selectDate.getFullYear(),
                    ids: this.companyId
                }
            })
            .then(res => {
                if (res.data.result) {
                    let allArr: any[] = [...res.data.result].sort(
                        this._compare("itemId")
                    ),
                        excelThArr = new Set(); //表头
                    const MONTH = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
                    excelThArr.add("月份");
                    MONTH.forEach(item => {
                        //excel每行数据
                        let excelTdArr: number[] = [],
                            filterMonthArr = allArr.filter(t => t.billingPlanMonth == item);
                        let index1Arr = filterMonthArr.filter(
                            t => t.billingItemParentCode == null
                        );
                        //求和汇总
                        let sumArr: Array<number> = [0];
                        index1Arr.forEach(element => {
                            let index2Arr: any[] = filterMonthArr.filter(
                                t => t.billingItemParentCode == element.billingItemCode
                            );
                            if (index2Arr.length > 0) {
                                index2Arr.forEach(Pitem => {
                                    let index3Arr: any[] = filterMonthArr.filter(
                                        t => t.billingItemParentCode == Pitem.billingItemCode
                                    );
                                    if (index3Arr.length > 0) {
                                        index3Arr.forEach(Citem => {
                                            excelThArr.add(Citem.billingItemName);
                                            excelTdArr.push(Citem.amount);
                                        });
                                    }
                                    excelThArr.add(Pitem.billingItemName);
                                    excelTdArr.push(Pitem.amount);
                                });
                            }
                            excelThArr.add(element.billingItemName);
                            excelTdArr.push(element.amount);
                            sumArr.push(element.amount);
                        });
                        excelTdArr = [item, ...excelTdArr, this._summation(sumArr)];
                        this.excelArr.push(excelTdArr);
                    });
                    excelThArr.add("总成本汇总");
                    this.excelArr = [
                        [...excelThArr], ...this.excelArr, [...this.allArr]
                    ];
                    this._transformExcel();
                } else if (res.data.result == null) {
                    this.$Message.warning("暂无数据");
                }
            });
    }
    //转换excel
    _transformExcel() {
        const filename = `${
            this.companyName
            }${this.selectDate.getFullYear()}年成本汇总.xlsx`;
        const ws_name = "SheetJS";
        const worksheet = XLSX.utils.aoa_to_sheet(this.excelArr);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, ws_name);
        // generate Blob
        const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], { type: "application/octet-stream" });
        // save file
        let link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        setTimeout(() => {
            // 延时释放掉obj
            URL.revokeObjectURL(link.href);
            link.remove();
            this.excelArr = [];
        }, 500);
    }
    //页面接口数据转换为多维数组
    _changeDataStructure() {
        this.changedData.costAmount = Number(this.changedData.costAmount);
        if (this.changedData.details) {
            this.changedData.details.forEach(element => {
                element.amount = Number(element.amount);
            });
            let index1Arr = this.changedData.details.filter(
                t => t.billingItemParentCode == null
            );
            this.changedData["list"] = [...index1Arr];
            this.changedData["list"].forEach((Pitem, Pindex) => {
                let index2Arr = this.changedData.details.filter(
                    t => t.billingItemParentCode == Pitem.billingItemCode
                );
                Pitem["list"] = [...index2Arr];
                if (Pitem["list"].length > 0) {
                    Pitem["list"].forEach(Citem => {
                        let index3Arr = this.changedData.details.filter(
                            t => t.billingItemParentCode == Citem.billingItemCode
                        );
                        Citem["list"] = [...index3Arr];
                    });
                }
            });
            delete this.changedData.details;
        }
    }
    //给包含对象的数组排序
    _compare(property) {
        return function (obj1, obj2) {
            let value1 = obj1[property];
            let value2 = obj2[property];
            return value1 - value2;
        };
    }
    //父组件懒调用 相当于create
    simulationCreated(flag) {
        //默认加载时间为一年前
        let now: any = new Date();
        now.setMonth(now.getMonth() - 1);
        this.selectDate = now;
        this.getData();
        this.$store
            .dispatch({
                type: "run/GET_each_Total",
                params: {
                    issueYear: this.selectDate.getFullYear(),
                    ids: this.companyId
                }
            })
            .then(res => {
                if (res.data.result) {
                    let allArr = [...res.data.result].sort(this._compare("itemId"));
                    let excelTdArr: any[] = [];
                    let index1Arr = allArr.filter(t => t.billingItemParentCode == null);
                    let sumArr: Array<number> = [0];
                    index1Arr.forEach(element => {
                        let index2Arr = allArr.filter(
                            t => t.billingItemParentCode == element.billingItemCode
                        );
                        if (index2Arr.length > 0) {
                            index2Arr.forEach(Pitem => {
                                let index3Arr = allArr.filter(
                                    t => t.billingItemParentCode == Pitem.billingItemCode
                                );
                                if (index3Arr.length > 0) {
                                    index3Arr.forEach(Citem => {
                                        excelTdArr.push(Citem.amount);
                                    });
                                }
                                excelTdArr.push(Pitem.amount);
                            });
                        }
                        excelTdArr.push(element.amount);
                        sumArr.push(element.amount);
                    });
                    excelTdArr.push(this._summation(sumArr));
                    excelTdArr.unshift("汇总");
                    this.allArr = [...excelTdArr];
                }
            });
    }
}