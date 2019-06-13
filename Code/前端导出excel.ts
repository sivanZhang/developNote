//import XLSX from "xlsx";
export default class {

    //inputNumber 的:max计算  来限制所有inputNumber之和不能超过100
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
    isSubmit: boolean = false;
    changedData: any = {};
    originalData: any = {};
    //筛选日期初始化
    selectDate: any = "";
    //导出excel的源数组初始化
    excelArr: any[] = [];
    allArr: any[] = [];
    Json: any[] = [];

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
        const filename = `年成本汇总.xlsx`;
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


    //百分比求和ffff
    sumSLUpdating(Parent: any) {
        let total: number = 0;
        for (let item of Parent.SLlist) {
            total += item.costPercent;
        }
        Parent["SLsum"] = total;
        this.serviceLineList = [...this.serviceLineList];
    }
}