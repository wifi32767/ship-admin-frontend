<template>
  <div class="single-entry">
    <el-card>
      <template #header>单条数据录入</template>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="140px">
        <!-- 基本信息 -->
        <el-form-item label="信息名称" prop="deviceName">
          <el-input v-model="form.deviceName" />
        </el-form-item>

        <!-- 国家下拉 -->
        <el-form-item label="所属国家" prop="countryId">
          <el-select v-model="form.deviceCountryId" placeholder="请选择国家" filterable>
            <el-option
              v-for="c in countryList"
              :key="c.countryId"
              :label="c.countryName"
              :value="c.countryId"
            />
          </el-select>
        </el-form-item>

        <!-- 三级分类联动 -->
        <el-form-item label="一级分类" prop="classId">
          <el-select v-model="form.deviceClassId" @change="onClassChange" placeholder="请选择">
            <el-option
              v-for="cls in classList"
              :key="cls.classId"
              :label="cls.className"
              :value="cls.classId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="二级分类" prop="styleId">
          <el-select v-model="form.deviceStyleId" @change="onStyleChange" placeholder="请选择" :disabled="!form.deviceClassId">
            <el-option
              v-for="sty in currentStyles"
              :key="sty.styleId"
              :label="sty.styleName"
              :value="sty.styleId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="三级分类" prop="typeId">
          <el-select v-model="form.deviceTypeId" placeholder="请选择" :disabled="!form.deviceStyleId">
            <el-option
              v-for="typ in currentTypes"
              :key="typ.typeId"
              :label="typ.typeName"
              :value="typ.typeId"
            />
          </el-select>
        </el-form-item>

        <!-- 其他字段 -->
        <el-form-item label="使用年份" prop="deviceUseYear">
          <el-input-number v-model="form.deviceUseYear" :min="1900" :max="2099" />
        </el-form-item>

        <el-form-item label="价格" prop="devicePrice">
          <el-input v-model="form.devicePrice" />
        </el-form-item>

        <el-form-item label="使用单位" prop="deviceUsingUnit">
          <el-input v-model="form.deviceUsingUnit" />
        </el-form-item>

        <el-form-item label="地理位置" prop="deviceLocation">
          <el-input v-model="form.deviceLocation" />
        </el-form-item>

        <el-form-item label="经度" prop="deviceLongitude">
          <el-input v-model="form.deviceLongitude" />
        </el-form-item>

        <el-form-item label="纬度" prop="deviceLatitude">
          <el-input v-model="form.deviceLatitude" />
        </el-form-item>

        <el-form-item label="图片URL" prop="deviceImg">
          <el-input v-model="form.deviceImg" placeholder="可填写图片链接" />
        </el-form-item>

        <el-form-item label="视频URL" prop="deviceVideo">
          <el-input v-model="form.deviceVideo" placeholder="可填写视频链接" />
        </el-form-item>

        <el-form-item label="介绍" prop="deviceIntroduce">
          <el-input type="textarea" v-model="form.deviceIntroduce" rows="4" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submit" :loading="submitting">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getCountryList, getClassList, submitSingleEntry } from '@/api/entry'

const formRef = ref()
const submitting = ref(false)

const form = reactive({
  deviceName: '',
  deviceCountryId: null,
  deviceClassId: null,
  deviceStyleId: null,
  deviceTypeId: null,
  deviceUseYear: null,
  devicePrice: '',
  deviceUsingUnit: '',
  deviceLocation: '',
  deviceLongitude: '',
  deviceLatitude: '',
  deviceImg: '',
  deviceVideo: '',
  deviceIntroduce: ''
})

const rules = {
  deviceName: [{ required: false, message: '请输入信息名称', trigger: 'blur' }],
  deviceCountryId: [{ required: false, message: '请选择国家', trigger: 'change' }],
  deviceClassId: [{ required: false, message: '请选择一级分类', trigger: 'change' }],
  deviceStyleId: [{ required: false, message: '请选择二级分类', trigger: 'change' }],
  deviceTypeId: [{ required: false, message: '请选择三级分类', trigger: 'change' }]
}

// 数据源
const countryList = ref([])
const classList = ref([])      // 一级分类列表

// 当前选中的一级分类下可用的二级分类
const currentStyles = computed(() => {
  const cls = classList.value.find(c => c.classId === form.deviceClassId)
  return cls ? cls.styleList : []
})

// 当前选中的二级分类下可用的三级分类
const currentTypes = computed(() => {
  const cls = classList.value.find(c => c.classId === form.deviceClassId)
  const sty = cls?.styleList?.find(s => s.styleId === form.deviceStyleId)
  return sty ? sty.typeList : []
})

// 加载国家列表
const loadCountries = async () => {
  const res = await getCountryList()
  if (res.code === 200) countryList.value = res.data || []
}

// 加载分类树
const loadClasses = async () => {
  const res = await getClassList()
  if (res.code === 200) classList.value = res.data || []
}

// 联动处理
const onClassChange = () => {
  form.deviceStyleId = null
  form.deviceTypeId = null
}
const onStyleChange = () => {
  form.deviceTypeId = null
}

// 提交
const submit = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    // 构造 DeviceVO，去掉多余字段
    const deviceVO = { ...form }
    const res = await submitSingleEntry(deviceVO)
    if (res.code === 200) {
      ElMessage.success('录入成功')
      resetForm()
    } else {
      ElMessage.error(res.message || '录入失败')
    }
  } catch (err) {
    ElMessage.error('提交失败：' + err.message)
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(form, {
    deviceName: '',
    deviceCountryId: null,
    deviceClassId: null,
    deviceStyleId: null,
    deviceTypeId: null,
    deviceUseYear: null,
    devicePrice: '',
    deviceUsingUnit: '',
    deviceLocation: '',
    deviceLongitude: '',
    deviceLatitude: '',
    deviceImg: '',
    deviceVideo: '',
    deviceIntroduce: ''
  })
}

onMounted(() => {
  loadCountries()
  loadClasses()
})
</script>

<style scoped>
.single-entry {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}
</style>