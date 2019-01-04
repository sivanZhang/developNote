## 关于移动端适配
>仿照设计图实现移动端多种屏幕尺寸适配！
```dash
1.设计图宽÷基准尺寸(自由设置，相当于设计图的fontsize，常见有100px、75px)= body宽的rem（一个比例）；
2.实际屏宽÷body宽的rem=实际的fontsize（按上面的比例逆向推算出实际fontsize，用后面的JS实现，不必关注）;
3.设计图元素/设计图fontsize = 我们要的rem（按照rem的定义）；

例如：
设计图中基准尺寸是100px
里面有个元素宽200px,该元素的rem宽=200px/100=2rem;

#js动态设置HTML的fontsize
<script type="text/javascript">
    var docEl = document.documentElement,
      resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
      recalc = function() {
        var clientWidth = docEl.clientWidth;
        if (!clientWidth) return;
        docEl.style.fontSize = (clientWidth / 3.75) + 'px';  #3.75是设计图宽/基准尺寸
        if (clientWidth > 1024) {
          docEl.style.fontSize = '200px';
        }
      };
    //if (!document.addEventListener) return;
    window.addEventListener(resizeEvt, recalc, false);
    document.addEventListener('DOMContentLoaded', recalc, false);
  </script>
```
