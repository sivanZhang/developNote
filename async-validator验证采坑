在VUE+IVIEW开放项目中用async-validator进行表单效验，但是无法生效。
解决方法：自定义验证方法、并把value的值默认为要验证的对象；
例如：
validatePort(rule: any, value: any = this.user.queueAccountDto.port, callback: any) {
      console.log('value:' + value)
      if (rule.pattern.test(value)) {
        callback();
      } else {
        callback(new Error('端口号必须为数字'));
      }
    };
    userRule = {
      port: [{ validator: this.validatePort, pattern: /^(\s*|\d+)$/, message: "必须是数字格式", trigger: "change" }]，
    }
