<template>
  <div class="icon-add">
    <el-upload
      ref="upload"
      :multiple="false"
      name="mfile"
      :data="{
        folderPath: 'managePoint'
      }"
      class="avatar-uploader"
      :action="BaseURL + '/fileUploadPath'"
      :show-file-list="false"
      :on-success="handler"
      :on-change="viewImage"
      :auto-upload="false"
      :file-list="fileList"
      title="添加图标"
    >
      <img v-if="imageUrl" :src="imageUrl" class="avatar" />
      <i v-else class="el-icon-plus avatar-uploader-icon"></i>
    </el-upload>
    <el-input
      type="text"
      size="mini"
      class="icon-name"
      placeholder="图标名称"
      v-model="name"
    />
    <el-button type="text" size="mini" @click="uploadImage()">上传</el-button>
  </div>
</template>

<script>
import { addIcon } from "@/api/managePoint";
export default {
  data() {
    return {
      fileList:[],
      imageUrl: "",
      name: ""
    };
  },
  methods: {
    uploadImage() {
      this.$refs["upload"].submit();
    },
    handler(result, file) {
      if (result.code === 0) {
        let data = { picture: result.data.savePath }
        if(this.name){
          data.name = this.name
        }else{
          data.name = '未命名'
        }
        addIcon(data).then(({data})=>{
          if(data.code === 0){
            this.$message.success(data.message);
            this.imageUrl = ''
            this.name = ''
            this.$emit('upload-success')
          }else{
            this.$message.warning(data.message);
          }
        })
      }
    },
    viewImage(file) {
      // file.raw 是 File对象
      const reader = new FileReader();
      // 方法1   ：blob地址
      this.imageUrl = URL.createObjectURL(file.raw);
      this.fileList = [file]
    },
    beforeAvatarUpload(file) {
      const isJPG = file.type === "image/jpeg";
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG) {
        this.$message.error("只能是图骗格式!");
      }
      if (!isLt2M) {
        this.$message.error("图片大小不能超过 2MB!");
      }
      return isJPG && isLt2M;
    }
  }
};
</script>

<style lang="scss" scoped>
.icon-add {
  border: 1px dotted #409eff;
  padding: 10px 10px 0 10px;
  height: 190px;
  & /deep/ .el-upload {
    width: 100%;
  }
}
.avatar-uploader .el-upload {
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader .el-upload:hover {
  background: #409eff;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100%;
  height: 119px;
  line-height: 119px;
  text-align: center;
}
.avatar {
  width: 100%;
  height: 117px;
  display: block;
  object-fit: cover;
}
</style>
