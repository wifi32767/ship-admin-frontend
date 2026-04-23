// category.js
import request from './request'

// ==================== 分类数据获取 ====================
// 获取完整分类树（一级 + 二级 + 三级）
export const getCategoryTree = async () => {
  const res = await request.get('/api/class/list')
  if (res.code === 200 && res.data) {
    // 转换为前端树形结构
    const treeData = transformBackendTree(res.data)
    return { code: 200, data: treeData }
  }
  return res
}

// ==================== 一级分类（Class）接口 ====================
export const createClass = (data) => {
  return request.post('/api/class/class', data, {
    headers: { 'Content-Type': 'application/json' }
  })
}

export const updateClass = (data) => {
  return request.put('/api/class/class', data, {
    headers: { 'Content-Type': 'application/json' }
  })
}

export const deleteClass = (classId) => {
  return request.delete('/api/class/class', { params: { classId } })
}

// ==================== 二级分类（Style）接口 ====================
export const createStyle = (parentId, data) => {
  return request.post('/api/class/style', data, {
    params: { parentId },
    headers: { 'Content-Type': 'application/json' }
  })
}

export const updateStyle = (data) => {
  return request.put('/api/class/style', data, {
    headers: { 'Content-Type': 'application/json' }
  })
}

export const deleteStyle = (styleId) => {
  return request.delete('/api/class/style', { params: { styleId } })
}

// ==================== 三级分类（Type）接口 ====================
export const createType = (parentId, data) => {
  return request.post('/api/class/type', data, {
    params: { parentId },
    headers: { 'Content-Type': 'application/json' }
  })
}

export const updateType = (data) => {
  return request.put('/api/class/type', data, {
    headers: { 'Content-Type': 'application/json' }
  })
}

export const deleteType = (typeId) => {
  return request.delete('/api/class/type', { params: { typeId } })
}

// ==================== 辅助函数 ====================
// 转换前端表单数据为后端格式
export const convertToBackendData = (formData) => {
  const { id, name, description, level } = formData
  return { typeId: id, typeName: name, typeDescribe: description }
}

// 转换后端树形数据为前端表格所需格式
const transformBackendTree = (classList) => {
  if (!Array.isArray(classList)) return []

  return classList.map(classItem => {
    // 一级分类节点
    const level1Node = {
      id: classItem.classId,
      name: classItem.className,
      description: classItem.classDescribe || '',
      level: 1,
      parentId: null,
      createTime: classItem.createTime,
      children: []
    }

    // 处理二级分类
    const styleList = classItem.styleList || []
    if (styleList.length) {
      level1Node.children = styleList.map(styleItem => {
        const level2Node = {
          id: styleItem.styleId,
          name: styleItem.styleName,
          description: styleItem.styleDescribe || '',
          level: 2,
          parentId: classItem.classId,
          createTime: styleItem.createTime,
          children: []
        }

        // 处理三级分类
        const typeList = styleItem.typeList || []
        if (typeList.length) {
          level2Node.children = typeList.map(typeItem => ({
            id: typeItem.typeId,
            name: typeItem.typeName,
            description: typeItem.typeDescribe || '',
            level: 3,
            parentId: styleItem.styleId,
            createTime: typeItem.createTime,
            children: []
          }))
        }
        return level2Node
      })
    }
    return level1Node
  })
}

// 搜索分类（后端返回相同结构，同样需要转换）
export const searchCategories = async (keyword) => {
  const res = await request.get('/api/class/list/search', { params: { keyword } })
  if (res.code === 200 && Array.isArray(res.data)) {
    const treeData = transformBackendTree(res.data)
    return { code: 200, data: treeData }
  }
  return res
}