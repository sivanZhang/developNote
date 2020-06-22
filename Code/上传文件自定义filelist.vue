<template>
  <div class="upload-file">
    <el-upload
      ref="upload"
      drag
      multiple
      auto-upload
      name="files"
      :show-file-list="false"
      :on-success="successHandler"
      :on-progress="progressHandler"
      :action="uploadUrl"
      :headers="headers"
      :before-upload="beforeUploadHandler"
      :on-error="errorHandler"
    >
      <i class="el-icon-upload"></i>
      <div class="el-upload__text">点击或将文件拖拽到这里上传</div>
    </el-upload>
    <section class="file-list">
      <div v-for="item of uploadList" :key="item.uid" class="file-list--item">
        <div class="list--item-name">
          <el-image :src="attachImage(item.suffix)"></el-image>
          {{ item.name }}
        </div>
        <div class="list--item-status">
          <el-icon v-if="item.status === 'fail'" class="el-icon-error"> </el-icon>
          <el-progress
            v-else
            type="circle"
            :width="16"
            :stroke-width="8"
            :show-text="false"
            stroke-linecap="butt"
            :percentage="item.percent"
          ></el-progress>
          <el-button type="text" @click="deleteFile(0, item.uid)">
            <i class="iconfont icon16icon_shanchu" title="删除"></i>
          </el-button>
        </div>
      </div>
      <div
        v-for="item of fileList"
        :key="item.bAttacId"
        class="file-list--item"
      >
        <div class="list--item-name">
          <el-image :src="attachImage(item.bAttacSuffix)"></el-image>
          {{ item.bAttacOriginname }}
        </div>
        <div class="list--item-status">
          <el-icon class="el-icon-success"> </el-icon>
          <el-button type="text" @click="deleteFile(1, item.bAttacId)">
            <i class="iconfont icon16icon_shanchu" title="删除"></i>
          </el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
/* :action ="uploadUrl"
      :headers="headers" */
/* :http-request="fileRequest" */
import { upload_files, delete_file } from "@/api/study";
import { getToken } from "@/utils/auth";
export default {
  props: {
    /**
     *
     * 父组件使用必须加.sync
     * @property {Integer} fileList[index].bAttacId 文件id
     * @property {String} fileList[index].bAttacSuffix 文件后缀
     * @property {String} fileList[index].bAttacOriginname 文件名字
     * @property {Number} fileList[index].bAttacSize 文件大小
     *
     * */
    fileList: {
      type: Array,
      required: true,
    },
    // 值为false时只删除fileList  true时删除fileList和服务器的文件
    realDelete: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      uploadUrl: `${process.env.VUE_APP_BASE_API}/common/upload/all`,
      headers: {
        Authorization: getToken(),
      },
      percentage: 0,
      uploadList: [],
    };
  },
  computed: {
    attachImage() {
      return (suffix) => {
        const SUFFIX = suffix.toUpperCase();
        return SUFFIX ? require(`@/assets/smalltype/${SUFFIX}.png`) : null;
      };
    },
  },
  methods: {
    //附件上传
    fileRequest(file) {
      /* onProgress */
      let uploadData = new FormData();
      uploadData.append(file.filename, file.file);
      const self = this;
      function onProgress(e) {
        self.percentage = e.percent;
      }
      upload_files(uploadData).then((res) => {});
    },

    /* 
    file.status = ready || succsess||unloading
    */

    successHandler(res, file, fileList) {
      if (res.code === 200) {
        let currentResult = res.data[0];
        if (!currentResult.result) {
          this.$message.warning(`${file.name}${currentResult.msg}`);
          return;
        } else {
          const index = this.uploadList.findIndex((t) => t.uid === file.uid);
          const deleteItem = this.uploadList.splice(index, 1);
          this.$emit("update:file-list", [
            {
              bAttacId: currentResult.attaccId,
              bAttacOriginname: currentResult.fileName,
              bAttacSize: deleteItem.size,
              bAttacSuffix: currentResult.bAttacSuffix,
              bAttacFilepath: currentResult.url,
            },
            ...this.fileList,
          ]);
        }
      }else{
        const currentUpload = this.uploadList.find((t) => t.uid === file.uid);
        currentUpload.status = 'fail'
      }
      let isAllUpload = fileList.every((t) => t.status === "succsess");
      isAllUpload && this.$message.success("所有文件上传完成");
    },
    progressHandler(e, file, fileList) {
      this.uploadList.forEach((t) => {
        t.uid === file.uid && (t.percent = e.percent);
      });
    },
    //  每个文件上传前转换为自定义数据加入数组
    beforeUploadHandler({ uid, name, status, size }) {
      const suffix = name.substring(name.lastIndexOf(".") + 1);
      this.uploadList.push({
        suffix,
        uid,
        size,
        percent: 0,
        name,
        status:status||''
      });
    },
    /**
     *
     * 删除文件列表的单个文件
     * @property {Integer} type 1 = 删除保存后端的文件  0 = 删除未保存后端的文件
     * @property {Integer} id
     *
     * */
    deleteFile(type = 1, id) {
      if (type) {
        const arr = [...this.fileList];
        if (this.realDelete) {
          delete_file(id).then((data) => {
            if (data.code === 200) {
              arr.forEach((t, i) => {
                t.bAttacId === id && arr.splice(i, 1);
              });
              this.$emit("update:file-list", arr);
            }
          });
        } else {
          arr.forEach((t, i) => {
            t.bAttacId === id && arr.splice(i, 1);
          });
          this.$emit("update:file-list", arr);
        }
      } else {
        this.uploadList.forEach((t, i) => {
          t.uid === id && this.uploadList.splice(i, 1);
        });
      }
    },
    errorHandler(err, file, fileList) {},

    //(on-change  >  before-upload ) > (on-progress>on-success>on-change)
  },
};
</script>

<style lang="scss">
.upload-file {
  .file-list {
    color: #ccc;
    padding-top: 8px;
    .file-list--item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0 16px 8px;
      border-bottom: 1px solid #222222;
      .list--item-status {
        font-size: 16px;
        display: flex;
        align-items: center;
        .el-icon-success {
          color: #5bc269;
        }
        .el-icon-error {
          color: #ff4747;
        }
        .el-button {
          margin-left: 16px;
        }
      }
      .list--item-name {
        display: flex;
        align-items: center;
        line-height:100%;
      }
      .el-image {
        width: 26px;
        margin-right: 16px;
      }
    }
  }
  .el-upload-dragger {
    width: 100%;
    background: rgba(34, 34, 34, 1);
    border-radius: 2px;
    border: 1px solid rgba(68, 68, 68, 1);
  }
  .el-upload {
    display: block;
  }
}
</style>
