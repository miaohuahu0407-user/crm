/**
 * @name CRM 客户详情页4
 *
 * 参考资料：
 * - /rules/development-guide.md
 * - /src/prototypes/crm-customer-detail/spec.md
 * - /src/database/orders.json
 * - /src/database/product_specs.json
 */

import './style.css';

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import {
  ArrowLeft,
  Bell,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  FileText,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Warehouse,
  X,
} from 'lucide-react';

import ordersDb from '../../database/orders.json';
import presaleProductsDb from '../../database/presale_products.json';
import productSpecsDb from '../../database/product_specs.json';
import type {
  Action,
  AxureHandle,
  AxureProps,
  ConfigItem,
  DataDesc,
  EventItem,
  KeyDesc,
} from '../../common/axure-types';

type NavItem = {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
};

type NavGroup = {
  label: string;
  icon: React.ReactNode;
  items?: NavItem[];
};

type DetailRecord = {
  id: string;
  displayName: string;
  owner: string;
  followUpBy: string;
  customerType: string;
  manualLevel: string;
  annualAmount: string;
  autoLevel: string;
  region: string;
  website: string;
  address: string;
  note: string;
  orderRemark: string;
  createdAt: string;
  lastFollowAt: string;
  lastOrderAt: string;
  tags: string[];
  receiver: string;
  phone: string;
  shippingAddress: string;
  trendPoints: number[];
  consumePercent: number;
};

type GoalType = '金额目标' | '里程碑目标';
type GoalStatus = '进行中' | '有风险' | '已完成';
type TaskStatus = '未开始' | '进行中' | '有风险' | '已完成';
type TaskType = '新品推送' | '订单跟进' | '预售打板' | '客情维护' | '其他';
type TaskPriority = '高' | '中' | '低';
type AttachmentPreviewMode = 'warm' | 'cool' | 'neutral';
type TaskListFilter = 'all' | '进行中' | '有风险' | '已完成';
type TaskPrioritySortDirection = 'desc' | 'asc';

type GoalTarget = {
  id: string;
  customerId: string;
  title: string;
  goalType: GoalType;
  owner: string;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  targetAmount?: number;
  currentAmount?: number;
  summary: string;
  linkedOrderIds: string[];
};

type TaskItem = {
  id: string;
  goalId: string;
  customerId: string;
  title: string;
  taskType: TaskType;
  assignee: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  description: string;
  linkedOrderIds: string[];
  latestProgressAt: string;
};

type ProgressAttachment = {
  id: string;
  type: 'image';
  name: string;
  previewMode: AttachmentPreviewMode;
};

type TaskProgressLog = {
  id: string;
  taskId: string;
  customerId: string;
  submittedBy: string;
  submittedAt: string;
  progressPercent: number;
  content: string;
  status: TaskStatus;
  attachments: ProgressAttachment[];
};

type OrderRecord = {
  id: string;
  customerId: string;
  customerName: string;
  orderTime: string;
  createdBy: string;
  consignee: string;
  mobile: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  orderAmount: number;
  address: string;
  paymentMethod: string;
  orderStatus: string;
};

type TaskTimelineEntry =
  | {
      id: string;
      type: 'progress';
      happenedAt: string;
      title: string;
      submittedBy: string;
      status: TaskStatus;
      content: string;
      attachments: ProgressAttachment[];
    }
  | {
      id: string;
      type: 'order';
      happenedAt: string;
      title: string;
      createdBy: string;
      orderAmount: number;
      orderStatus: string;
      content: string;
      order: OrderRecord;
    };

type MonthlyAnalysisPoint = {
  monthKey: string;
  label: string;
  orderAmount: number;
  orderCount: number;
  completedOrderAmount: number;
  pendingOrderAmount: number;
  completedOrderCount: number;
  pendingOrderCount: number;
  followUpCount: number;
  productSummary: string;
};

type GoalConversionStepTone = 'all' | 'progress' | 'done' | 'order';

type GoalConversionStep = {
  label: string;
  value: number;
  hint: string;
  tone: GoalConversionStepTone;
};

type ProductSpecRecord = {
  productName: string;
  styleCode: string;
  platingColor: string;
  colorName: string;
};

type PresaleStatus = '待打板' | '打板中' | '已打板' | '已确认' | '已转正品' | '已废弃';

type CustomerRef = {
  customerId: string;
  customerName: string;
};

type PresaleSpecRecord = {
  id: string;
  platingColor: string;
  colorName: string;
  proofingStatus: PresaleStatus;
  developmentProgress: number;
  estimatedCompletionDate: string;
  canConvert: boolean;
  customers: CustomerRef[];
};

type PresaleProductRecord = {
  id: string;
  productName: string;
  category: string;
  styleCode: string;
  designImage: string;
  sourceType: 'new' | 'existing';
  existingProductId: string;
  supplierId: string;
  supplierName: string;
  supplierContact: string;
  supplierPhone: string;
  createdDate: string;
  createdBy: string;
  note: string;
  linkedOrderId: string;
  linkedTaskId: string;
  specs: PresaleSpecRecord[];
};

type PurchaseStructureDimension = 'platingColor' | 'colorName' | 'styleCode';

type PurchaseStructureItem = {
  key: string;
  label: string;
  orderCount: number;
  productCount: number;
  quantity: number;
  amount: number;
  share: number;
};

type GoalFormState = {
  title: string;
  goalType: GoalType;
  owner: string;
  endDate: string;
  targetAmount: string;
  currentAmount: string;
  status: GoalStatus;
  summary: string;
};

type TaskFormState = {
  title: string;
  taskType: TaskType;
  assignee: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  description: string;
};

type ProgressFormState = {
  submittedBy: string;
  status: TaskStatus;
  content: string;
  attachmentPresetIds: string[];
};

type ShippingAddressRecord = {
  id: string;
  customerId: string;
  receiver: string;
  mobile: string;
  region: string;
  detailAddress: string;
};

type ShippingAddressFormState = {
  receiver: string;
  mobile: string;
  region: string;
  detailAddress: string;
};

type TagFormState = {
  name: string;
};

type ContactRecord = {
  id: string;
  customerId: string;
  name: string;
  email: string;
  position: string;
  socialPlatform: string;
  socialAccount: string;
  phonePrefix: string;
  phone: string;
  birthday: string;
  gender: string;
  cardName: string;
  remark: string;
};

type ContactFormState = {
  name: string;
  email: string;
  position: string;
  socialPlatform: string;
  socialAccount: string;
  phonePrefix: string;
  phone: string;
  birthday: string;
  gender: string;
  cardName: string;
  remark: string;
};

const TODAY = '2026-04-23';
const ANALYSIS_MONTH_COUNT = 6;
const PURCHASE_STRUCTURE_TOP_LIMIT = 10;
const PURCHASE_STRUCTURE_DIMENSIONS: Array<{ key: PurchaseStructureDimension; label: string }> = [
  { key: 'platingColor', label: '电镀色' },
  { key: 'colorName', label: '颜色' },
  { key: 'styleCode', label: '款式' },
];
const DEFAULT_PRODUCT_SPECS = getRawList(productSpecsDb).map(normalizeProductSpecRecord);
const DEFAULT_PRESALE_PRODUCTS = getRawList(presaleProductsDb).map((item) =>
  normalizePresaleProductRecord(item as Record<string, unknown>),
);

const EVENT_LIST: EventItem[] = [
  { name: 'on_back_to_list', desc: '点击返回列表按钮时触发' },
  { name: 'on_create_goal', desc: '创建业绩目标时触发' },
  { name: 'on_select_goal', desc: '切换业绩目标时触发' },
  { name: 'on_create_task', desc: '创建目标任务时触发' },
  { name: 'on_select_task', desc: '切换当前任务时触发' },
  { name: 'on_submit_task_progress', desc: '提交任务进度时触发' },
  { name: 'on_link_task_orders', desc: '绑定或取消绑定任务订单时触发' },
  { name: 'on_open_shipping_addresses', desc: '打开客户收货地址列表时触发' },
  { name: 'on_create_shipping_address', desc: '新增客户收货地址时触发' },
  { name: 'on_update_shipping_address', desc: '编辑客户收货地址时触发' },
  { name: 'on_delete_shipping_address', desc: '删除客户收货地址时触发' },
  { name: 'on_open_contacts', desc: '打开客户联系人列表时触发' },
  { name: 'on_create_contact', desc: '新增客户联系人时触发' },
  { name: 'on_update_contact', desc: '编辑客户联系人时触发' },
  { name: 'on_delete_contact', desc: '删除客户联系人时触发' },
  { name: 'on_create_customer_tag', desc: '新增客户标签时触发' },
  { name: 'on_open_presale_products', desc: '打开客户预售产品列表时触发' },
  { name: 'on_link_presale_product', desc: '关联预售产品到任务时触发' },
];

const ACTION_LIST: Action[] = [];

const VAR_LIST: KeyDesc[] = [
  { name: 'current_customer_id', desc: '当前详情页客户编号' },
  { name: 'selected_goal_id', desc: '当前选中的目标编号' },
  { name: 'selected_task_id', desc: '当前选中的任务编号' },
  { name: 'selected_order_id', desc: '当前高亮的订单编号' },
  { name: 'open_task_count', desc: '当前客户未完成任务数' },
  { name: 'overdue_task_count', desc: '当前客户逾期任务数' },
  { name: 'shipping_address_count', desc: '当前客户收货地址数量' },
  { name: 'contact_count', desc: '当前客户联系人数量' },
  { name: 'tag_count', desc: '当前客户标签数量' },
  { name: 'presale_product_count', desc: '当前客户预售产品数量' },
];

const CONFIG_LIST: ConfigItem[] = [
  {
    type: 'input',
    attributeId: 'operator_name',
    displayName: '操作人名称',
    info: '显示在右上角头像左侧的用户名',
    initialValue: '阿塔咪',
  },
];

const DATA_LIST: DataDesc[] = [
  {
    name: 'customer_detail',
    desc: '客户详情数据',
    keys: [
      { name: 'id', desc: '客户编号' },
      { name: 'display_name', desc: '客户简称' },
      { name: 'owner', desc: '归属人' },
      { name: 'follow_up_by', desc: '跟进人' },
      { name: 'customer_type', desc: '客户类型' },
      { name: 'annual_amount', desc: '近一年累计金额' },
    ],
  },
  {
    name: 'goal_targets',
    desc: '客户业绩目标数据',
    keys: [
      { name: 'id', desc: '目标编号' },
      { name: 'customer_id', desc: '客户编号' },
      { name: 'goal_type', desc: '目标类型' },
      { name: 'end_date', desc: '目标截止日期' },
      { name: 'target_amount', desc: '目标金额' },
      { name: 'current_amount', desc: '当前金额' },
    ],
  },
  {
    name: 'task_items',
    desc: '目标下任务数据',
    keys: [
      { name: 'id', desc: '任务编号' },
      { name: 'goal_id', desc: '所属目标编号' },
      { name: 'task_type', desc: '任务类型' },
      { name: 'assignee', desc: '指定人' },
      { name: 'due_date', desc: '目标日期' },
      { name: 'linked_order_ids', desc: '关联订单编号列表' },
    ],
  },
  {
    name: 'task_progress_logs',
    desc: '任务进度日志数据',
    keys: [
      { name: 'id', desc: '进度编号' },
      { name: 'task_id', desc: '任务编号' },
      { name: 'submitted_at', desc: '提交时间' },
      { name: 'progress_percent', desc: '进度百分比' },
      { name: 'attachments', desc: '附件列表' },
    ],
  },
  {
    name: 'customer_orders',
    desc: '客户订单数据',
    keys: [
      { name: 'id', desc: '订单编号' },
      { name: 'customer_id', desc: '客户编号' },
      { name: 'customer_name', desc: '客户名称' },
      { name: 'order_time', desc: '下单时间' },
      { name: 'order_amount', desc: '订单金额' },
      { name: 'order_status', desc: '订单状态' },
    ],
  },
  {
    name: 'product_specs',
    desc: '商品规格映射数据',
    keys: [
      { name: 'product_name', desc: '商品名称' },
      { name: 'style_code', desc: '款式编码' },
      { name: 'plating_color', desc: '电镀色' },
      { name: 'color_name', desc: '颜色' },
    ],
  },
  {
    name: 'customer_shipping_addresses',
    desc: '客户收货地址数据',
    keys: [
      { name: 'id', desc: '收货地址编号' },
      { name: 'customer_id', desc: '客户编号' },
      { name: 'receiver', desc: '收货人' },
      { name: 'mobile', desc: '联系方式' },
      { name: 'region', desc: '国家地区' },
      { name: 'detail_address', desc: '详细地址' },
    ],
  },
  {
    name: 'customer_contacts',
    desc: '客户联系人数据',
    keys: [
      { name: 'id', desc: '联系人编号' },
      { name: 'customer_id', desc: '客户编号' },
      { name: 'name', desc: '联系人' },
      { name: 'email', desc: '邮箱' },
      { name: 'position', desc: '职位' },
      { name: 'phone', desc: '联系电话' },
    ],
  },
];

const NAV_GROUPS: NavGroup[] = [
  {
    label: '仪表盘',
    icon: <LayoutDashboard size={14} />,
  },
  {
    label: '产品管理',
    icon: <Package size={14} />,
    items: [
      { label: '产品列表', icon: <Package size={13} /> },
      { label: '预售产品', icon: <ShoppingBag size={13} /> },
    ],
  },
  {
    label: '销售管理',
    icon: <ShoppingBag size={14} />,
    items: [
      { label: '客户列表', icon: <Users size={13} />, active: true },
      { label: '订单列表', icon: <FileText size={13} /> },
    ],
  },
  {
    label: '采购管理',
    icon: <ShoppingCart size={14} />,
    items: [
      { label: '库存预警', icon: <Bell size={13} /> },
      { label: '待采购列表', icon: <Clock3 size={13} /> },
    ],
  },
  {
    label: '仓储管理',
    icon: <Warehouse size={14} />,
    items: [
      { label: '实时库存', icon: <Warehouse size={13} /> },
      { label: '入库列表', icon: <FileText size={13} /> },
      { label: '发货列表', icon: <Truck size={13} /> },
      { label: '物流公司', icon: <Truck size={13} /> },
      { label: '打包待列表', icon: <Boxes size={13} /> },
    ],
  },
  {
    label: '财务管理',
    icon: <Wallet size={14} />,
  },
  {
    label: '系统管理',
    icon: <Settings size={14} />,
  },
];

const ATTACHMENT_PRESETS = [
  { id: 'factory-board', name: '打板图片', previewMode: 'warm' as AttachmentPreviewMode },
  { id: 'shelf-photo', name: '陈列图片', previewMode: 'cool' as AttachmentPreviewMode },
  { id: 'order-screenshot', name: '订单截图', previewMode: 'neutral' as AttachmentPreviewMode },
];

const DETAIL_RECORDS: Record<string, DetailRecord> = {
  K2604100347139123: {
    id: 'K2604100347139123',
    displayName: '胡******户',
    owner: '黄家颖',
    followUpBy: '陈敏',
    customerType: '零售商',
    manualLevel: 'A类意向',
    annualAmount: '¥45,000',
    autoLevel: '高潜',
    region: '百慕大',
    website: 'www.clearal-demo.com',
    address: '百慕大哈密尔顿港仓配中心 18 层',
    note: '偏好新品首发与预售联动，反馈速度快。',
    orderRemark: '优先合并发运并同步包材确认。',
    createdAt: '2026-04-10 15:47:14',
    lastFollowAt: '2026-04-21 18:20:00',
    lastOrderAt: '2026-04-22 16:35:40',
    tags: ['重点培育', '新品敏感', '预售跟紧'],
    receiver: '胡**0',
    phone: '138****1234',
    shippingAddress: '百慕大哈密尔顿港仓配中心 18 层',
    trendPoints: [1200, 1800, 1600, 2600, 3200, 5400, 6200],
    consumePercent: 92,
  },
  K2604210349432034: {
    id: 'K2604210349432034',
    displayName: '谭****息',
    owner: '阿塔咪',
    followUpBy: '陈敏',
    customerType: '零售商',
    manualLevel: 'B类跟进',
    annualAmount: '¥18,200',
    autoLevel: '成长',
    region: '阿尔巴尼亚',
    website: '-',
    address: '阿尔巴尼亚都拉斯港保税库 3 区',
    note: '关注A产品组合，需要稳定节奏推动订单转化。',
    orderRemark: '先确认库存后发起分批交付。',
    createdAt: '2026-04-21 15:49:44',
    lastFollowAt: '2026-04-22 09:30:00',
    lastOrderAt: '2026-04-22 15:50:10',
    tags: ['很关注A产品', '可复购'],
    receiver: '谭*',
    phone: '131****9513',
    shippingAddress: '阿尔巴尼亚都拉斯港保税库 3 区',
    trendPoints: [400, 900, 1200, 1300, 1800, 2100, 2600],
    consumePercent: 88,
  },
  K2604211152018593: {
    id: 'K2604211152018593',
    displayName: '谭*******息',
    owner: '陈敏',
    followUpBy: '陈敏',
    customerType: '个人买家',
    manualLevel: '新品观察',
    annualAmount: '¥9,800',
    autoLevel: '培育',
    region: '奥兰群岛',
    website: '-',
    address: '奥兰群岛跨境集货点 2 号仓',
    note: '个人买家，偏好小批量尝新，需高频跟进。',
    orderRemark: '预售需同步打样时间和发货承诺。',
    createdAt: '2026-04-21 11:52:01',
    lastFollowAt: '2026-04-22 17:45:00',
    lastOrderAt: '2026-04-22 18:55:00',
    tags: ['打板关注', '小单高频'],
    receiver: '谭**',
    phone: '139****1123',
    shippingAddress: '奥兰群岛跨境集货点 2 号仓',
    trendPoints: [300, 360, 500, 680, 920, 1200, 1450],
    consumePercent: 68,
  },
};

const DEFAULT_DETAIL = DETAIL_RECORDS.K2604100347139123;

const DEFAULT_SHIPPING_ADDRESSES: ShippingAddressRecord[] = [
  {
    id: 'addr-001',
    customerId: 'K2604100347139123',
    receiver: '胡**0',
    mobile: '138****1234',
    region: '百慕大',
    detailAddress: '哈密尔顿港仓配中心 18 层',
  },
  {
    id: 'addr-002',
    customerId: 'K2604210349432034',
    receiver: '豆*',
    mobile: '176****6121',
    region: '阿尔巴尼亚',
    detailAddress: '都拉斯港保税库 3 区',
  },
  {
    id: 'addr-003',
    customerId: 'K2604211152018593',
    receiver: '谭**',
    mobile: '139****1123',
    region: '奥兰群岛',
    detailAddress: '跨境集货点 2 号仓',
  },
];

const DEFAULT_CONTACTS: ContactRecord[] = [
  {
    id: 'contact-001',
    customerId: 'K2604100347139123',
    name: '胡**0',
    email: 'buyer@clearal-demo.com',
    position: '采购负责人',
    socialPlatform: '微信',
    socialAccount: 'clearal_buyer',
    phonePrefix: '+86',
    phone: '138****1234',
    birthday: '1990-05-18',
    gender: '女',
    cardName: '名片-胡女士.png',
    remark: '偏好新品资料先发图文版，重要订单需同步包材确认。',
  },
  {
    id: 'contact-002',
    customerId: 'K2604210349432034',
    name: '苗*',
    email: 'mia@example.com',
    position: '门店运营',
    socialPlatform: 'WhatsApp',
    socialAccount: '+355 176****6121',
    phonePrefix: '+355',
    phone: '176****6121',
    birthday: '',
    gender: '女',
    cardName: '',
    remark: '更关注 A 产品组合库存与分批发运节奏。',
  },
  {
    id: 'contact-003',
    customerId: 'K2604211152018593',
    name: '谭**',
    email: 'tan@example.com',
    position: '个人买家',
    socialPlatform: '微信',
    socialAccount: 'tan_buyer',
    phonePrefix: '+86',
    phone: '139****1123',
    birthday: '',
    gender: '女',
    cardName: '',
    remark: '个人买家，小批量高频沟通。',
  },
];

const DEFAULT_GOALS: GoalTarget[] = [
  {
    id: 'goal-001',
    customerId: 'K2604100347139123',
    title: '4月新品首发转化目标',
    goalType: '金额目标',
    owner: '陈敏',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    status: '进行中',
    targetAmount: 60000,
    currentAmount: 43200,
    summary: '围绕新品推送、预售打板和复购订单推进本月首发金额。',
    linkedOrderIds: ['ORD20251230001', 'ORD20251230004', 'ORD20251230008'],
  },
  {
    id: 'goal-002',
    customerId: 'K2604100347139123',
    title: '预售礼盒打板里程碑',
    goalType: '里程碑目标',
    owner: '黄家颖',
    startDate: '2026-04-12',
    endDate: '2026-05-08',
    status: '有风险',
    summary: '完成礼盒包装打板、样板确认和预售上架节奏。',
    linkedOrderIds: ['ORD20251230002', 'ORD20251230003'],
  },
  {
    id: 'goal-007',
    customerId: 'K2604100347139123',
    title: '母亲节档期备货风险化解',
    goalType: '里程碑目标',
    owner: '黄家颖',
    startDate: '2026-04-14',
    endDate: '2026-05-05',
    status: '有风险',
    summary: '聚焦母亲节档期预售备货和赠品确认，优先处理打样延期与备货节奏风险。',
    linkedOrderIds: ['ORD20251230005', 'ORD20251230006'],
  },
  {
    id: 'goal-008',
    customerId: 'K2604100347139123',
    title: '三月老客复购冲刺收官',
    goalType: '金额目标',
    owner: '陈敏',
    startDate: '2026-03-18',
    endDate: '2026-04-18',
    status: '已完成',
    targetAmount: 30000,
    currentAmount: 32600,
    summary: '通过老客回访、补货提醒和加购组合推荐完成阶段复购金额目标。',
    linkedOrderIds: ['ORD20251230007', 'ORD20251230009'],
  },
  {
    id: 'goal-003',
    customerId: 'K2604210349432034',
    title: 'A产品组合复购拉升',
    goalType: '金额目标',
    owner: '阿塔咪',
    startDate: '2026-04-10',
    endDate: '2026-05-15',
    status: '进行中',
    targetAmount: 50000,
    currentAmount: 17800,
    summary: '通过套餐推荐和订单节奏管理提升月度复购额。',
    linkedOrderIds: ['ORD20251230013', 'ORD20251230015', 'ORD20251230018'],
  },
  {
    id: 'goal-004',
    customerId: 'K2604210349432034',
    title: '新品B首单推进',
    goalType: '里程碑目标',
    owner: '陈敏',
    startDate: '2026-04-18',
    endDate: '2026-05-01',
    status: '进行中',
    summary: '先推送新品资料，再完成下单确认与交付节奏。',
    linkedOrderIds: ['ORD20251230016', 'ORD20251230020'],
  },
  {
    id: 'goal-005',
    customerId: 'K2604211152018593',
    title: '预售样板确认与下单',
    goalType: '里程碑目标',
    owner: '陈敏',
    startDate: '2026-04-15',
    endDate: '2026-05-06',
    status: '进行中',
    summary: '完成打板确认、上架沟通和个人买家预售转化。',
    linkedOrderIds: ['ORD20251230024', 'ORD20251230028'],
  },
  {
    id: 'goal-006',
    customerId: 'K2604211152018593',
    title: '周度复购金额目标',
    goalType: '金额目标',
    owner: '陈敏',
    startDate: '2026-04-20',
    endDate: '2026-05-10',
    status: '已完成',
    targetAmount: 8000,
    currentAmount: 8200,
    summary: '聚焦小批量复购订单和高频触达，完成周度金额拉升。',
    linkedOrderIds: ['ORD20251230029', 'ORD20251230030'],
  },
];

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: 'task-001',
    goalId: 'goal-001',
    customerId: 'K2604100347139123',
    title: '推送新品首发资料包',
    taskType: '新品推送',
    assignee: '陈敏',
    dueDate: '2026-04-25',
    status: '进行中',
    priority: '高',
    description: '整理新品清单、卖点、价格带和陈列建议，完成首轮触达。',
    linkedOrderIds: ['ORD20251230001'],
    latestProgressAt: '2026-04-22 10:20:00',
  },
  {
    id: 'task-002',
    goalId: 'goal-001',
    customerId: 'K2604100347139123',
    title: '跟进首发订单排期',
    taskType: '订单跟进',
    assignee: '黄家颖',
    dueDate: '2026-04-26',
    status: '进行中',
    priority: '中',
    description: '确认首发订单包装、发货窗口和客户确认节点。',
    linkedOrderIds: ['ORD20251230004', 'ORD20251230008'],
    latestProgressAt: '2026-04-22 15:00:00',
  },
  {
    id: 'task-003',
    goalId: 'goal-002',
    customerId: 'K2604100347139123',
    title: '预售礼盒打板确认',
    taskType: '预售打板',
    assignee: '陈敏',
    dueDate: '2026-04-24',
    status: '有风险',
    priority: '高',
    description: '盯打板回图、确认材质和尺寸，再推进客户确认。',
    linkedOrderIds: ['ORD20251230002', 'ORD20251230003'],
    latestProgressAt: '2026-04-23 09:15:00',
  },
  {
    id: 'task-004',
    goalId: 'goal-002',
    customerId: 'K2604100347139123',
    title: '确认预售上架节点',
    taskType: '客情维护',
    assignee: '黄家颖',
    dueDate: '2026-05-03',
    status: '未开始',
    priority: '中',
    description: '和客户确认活动档期、文案和最终上架节奏。',
    linkedOrderIds: [],
    latestProgressAt: '',
  },
  {
    id: 'task-011',
    goalId: 'goal-007',
    customerId: 'K2604100347139123',
    title: '确认母亲节赠品打样时间',
    taskType: '预售打板',
    assignee: '黄家颖',
    dueDate: '2026-04-24',
    status: '有风险',
    priority: '高',
    description: '赠品打样供应商回样延后，需要在本周内锁定打样时间并同步风险说明。',
    linkedOrderIds: ['ORD20251230005'],
    latestProgressAt: '2026-04-23 11:20:00',
  },
  {
    id: 'task-012',
    goalId: 'goal-007',
    customerId: 'K2604100347139123',
    title: '补齐母亲节档期备货清单',
    taskType: '订单跟进',
    assignee: '陈敏',
    dueDate: '2026-04-26',
    status: '进行中',
    priority: '中',
    description: '核对预售主推款、赠品和补货数量，确保节日前的备货节奏能落地执行。',
    linkedOrderIds: ['ORD20251230006'],
    latestProgressAt: '2026-04-22 19:10:00',
  },
  {
    id: 'task-013',
    goalId: 'goal-008',
    customerId: 'K2604100347139123',
    title: '完成老客补货复盘',
    taskType: '客情维护',
    assignee: '陈敏',
    dueDate: '2026-04-18',
    status: '已完成',
    priority: '低',
    description: '梳理老客补货节奏、商品偏好和下轮推荐组合，为下一阶段目标复用策略。',
    linkedOrderIds: ['ORD20251230007'],
    latestProgressAt: '2026-04-18 16:40:00',
  },
  {
    id: 'task-014',
    goalId: 'goal-008',
    customerId: 'K2604100347139123',
    title: '老客加购组合二次触达',
    taskType: '新品推送',
    assignee: '黄家颖',
    dueDate: '2026-04-17',
    status: '已完成',
    priority: '中',
    description: '针对高频老客补发组合推荐，带动加购和补货订单在月内完成转化。',
    linkedOrderIds: ['ORD20251230009'],
    latestProgressAt: '2026-04-17 18:20:00',
  },
  {
    id: 'task-005',
    goalId: 'goal-003',
    customerId: 'K2604210349432034',
    title: 'A产品复购订单催单',
    taskType: '订单跟进',
    assignee: '阿塔咪',
    dueDate: '2026-04-27',
    status: '进行中',
    priority: '高',
    description: '围绕A产品组合做复购节奏推进，锁定补货窗口。',
    linkedOrderIds: ['ORD20251230013', 'ORD20251230015'],
    latestProgressAt: '2026-04-22 11:40:00',
  },
  {
    id: 'task-006',
    goalId: 'goal-003',
    customerId: 'K2604210349432034',
    title: '输出组合陈列建议',
    taskType: '新品推送',
    assignee: '陈敏',
    dueDate: '2026-04-29',
    status: '已完成',
    priority: '中',
    description: '提供组合售卖建议和配套陈列图，提高追加转化。',
    linkedOrderIds: ['ORD20251230018'],
    latestProgressAt: '2026-04-21 16:35:00',
  },
  {
    id: 'task-007',
    goalId: 'goal-004',
    customerId: 'K2604210349432034',
    title: '新品B样品寄送',
    taskType: '新品推送',
    assignee: '陈敏',
    dueDate: '2026-04-24',
    status: '进行中',
    priority: '高',
    description: '发送样品和首单报价，推动客户确认新品B。',
    linkedOrderIds: ['ORD20251230016'],
    latestProgressAt: '2026-04-23 08:30:00',
  },
  {
    id: 'task-008',
    goalId: 'goal-005',
    customerId: 'K2604211152018593',
    title: '跟进预售样板进度',
    taskType: '预售打板',
    assignee: '陈敏',
    dueDate: '2026-04-25',
    status: '进行中',
    priority: '高',
    description: '跟催样板确认时间并同步发货承诺。',
    linkedOrderIds: ['ORD20251230024', 'ORD20251230028'],
    latestProgressAt: '2026-04-22 18:00:00',
  },
  {
    id: 'task-009',
    goalId: 'goal-005',
    customerId: 'K2604211152018593',
    title: '确认预售转化订单',
    taskType: '订单跟进',
    assignee: '陈敏',
    dueDate: '2026-04-23',
    status: '有风险',
    priority: '中',
    description: '跟进客户是否确认预售转化订单，当前决策偏慢。',
    linkedOrderIds: ['ORD20251230029'],
    latestProgressAt: '2026-04-23 10:10:00',
  },
  {
    id: 'task-010',
    goalId: 'goal-006',
    customerId: 'K2604211152018593',
    title: '完成本周复购复盘',
    taskType: '其他',
    assignee: '陈敏',
    dueDate: '2026-04-22',
    status: '已完成',
    priority: '低',
    description: '整理复购原因和下周跟进建议，为下一轮目标提供依据。',
    linkedOrderIds: ['ORD20251230030'],
    latestProgressAt: '2026-04-22 20:30:00',
  },
];

const DEFAULT_ORDERS: OrderRecord[] = [
  {
    id: 'ORD20251230001',
    customerId: 'K2604100347139123',
    customerName: '胡******户',
    orderTime: '2025-11-18 14:20:00',
    createdBy: '陈敏',
    consignee: '胡**0',
    mobile: '138****1234',
    productName: '冬季陈列试单包',
    unitPrice: 1599,
    quantity: 2,
    orderAmount: 3198,
    address: '百慕大哈密尔顿港仓配中心 18 层',
    paymentMethod: '银行转账',
    orderStatus: '已完成',
  },
  {
    id: 'ORD20251230002',
    customerId: 'K2604100347139123',
    customerName: '胡******户',
    orderTime: '2025-12-06 10:35:00',
    createdBy: '陈敏',
    consignee: '胡**0',
    mobile: '138****1234',
    productName: '预售礼盒打样单',
    unitPrice: 2280,
    quantity: 2,
    orderAmount: 4560,
    address: '百慕大哈密尔顿港仓配中心 18 层',
    paymentMethod: '微信支付',
    orderStatus: '待确认',
  },
  {
    id: 'ORD20251230003',
    customerId: 'K2604100347139123',
    customerName: '胡******户',
    orderTime: '2025-12-22 16:10:00',
    createdBy: '黄家颖',
    consignee: '胡**0',
    mobile: '138****1234',
    productName: '预售礼盒备用材质包',
    unitPrice: 1180,
    quantity: 3,
    orderAmount: 3540,
    address: '百慕大哈密尔顿港仓配中心 18 层',
    paymentMethod: '银行转账',
    orderStatus: '待打包',
  },
  {
    id: 'ORD20251230004',
    customerId: 'K2604100347139123',
    customerName: '胡******户',
    orderTime: '2026-01-12 09:50:00',
    createdBy: '黄家颖',
    consignee: '胡**0',
    mobile: '138****1234',
    productName: '新品首发基础套组',
    unitPrice: 1680,
    quantity: 4,
    orderAmount: 6720,
    address: '百慕大哈密尔顿港仓配中心 18 层',
    paymentMethod: '银行转账',
    orderStatus: '待发货',
  },
  {
    id: 'ORD20251230005',
    customerId: 'K2604100347139123',
    customerName: '胡******户',
    orderTime: '2026-02-08 13:25:00',
    createdBy: '黄家颖',
    consignee: '胡**0',
    mobile: '138****1234',
    productName: '母亲节赠品打样单',
    unitPrice: 1390,
    quantity: 3,
    orderAmount: 4170,
    address: '百慕大哈密尔顿港仓配中心 18 层',
    paymentMethod: '微信支付',
    orderStatus: '待打包',
  },
  {
    id: 'ORD20251230006',
    customerId: 'K2604100347139123',
    customerName: '胡******户',
    orderTime: '2026-02-26 11:40:00',
    createdBy: '陈敏',
    consignee: '胡**0',
    mobile: '138****1234',
    productName: '母亲节档期备货单',
    unitPrice: 1960,
    quantity: 3,
    orderAmount: 5880,
    address: '百慕大哈密尔顿港仓配中心 18 层',
    paymentMethod: '银行转账',
    orderStatus: '待发货',
  },
  {
    id: 'ORD20251230007',
    customerId: 'K2604100347139123',
    customerName: '胡******户',
    orderTime: '2026-03-11 15:20:00',
    createdBy: '陈敏',
    consignee: '胡**0',
    mobile: '138****1234',
    productName: '老客补货复盘试单',
    unitPrice: 1925,
    quantity: 4,
    orderAmount: 7700,
    address: '百慕大哈密尔顿港仓配中心 18 层',
    paymentMethod: '支付宝',
    orderStatus: '已完成',
  },
  {
    id: 'ORD20251230008',
    customerId: 'K2604100347139123',
    customerName: '胡******户',
    orderTime: '2026-03-24 17:10:00',
    createdBy: '黄家颖',
    consignee: '胡**0',
    mobile: '138****1234',
    productName: '新品首发加购组合',
    unitPrice: 2260,
    quantity: 4,
    orderAmount: 9040,
    address: '百慕大哈密尔顿港仓配中心 18 层',
    paymentMethod: '银行转账',
    orderStatus: '待发货',
  },
  {
    id: 'ORD20251230009',
    customerId: 'K2604100347139123',
    customerName: '胡******户',
    orderTime: '2026-04-09 11:02:12',
    createdBy: '黄家颖',
    consignee: '周涛',
    mobile: '133****4455',
    productName: '项链XL8726',
    unitPrice: 6999,
    quantity: 2,
    orderAmount: 6999,
    address: '深圳市南山区粤海街道科技园',
    paymentMethod: '支付宝',
    orderStatus: '待发货',
  },
  {
    id: 'ORD20251230013',
    customerId: 'K2604210349432034',
    customerName: '谭****息',
    orderTime: '2025-11-12 14:10:00',
    createdBy: '阿塔咪',
    consignee: '苗*',
    mobile: '176****6121',
    productName: 'A产品基础款',
    unitPrice: 1260,
    quantity: 2,
    orderAmount: 2520,
    address: '阿尔巴尼亚都拉斯港保税库 3 区',
    paymentMethod: '银行转账',
    orderStatus: '已完成',
  },
  {
    id: 'ORD20251230015',
    customerId: 'K2604210349432034',
    customerName: '谭****息',
    orderTime: '2026-02-16 13:10:05',
    createdBy: '阿塔咪',
    consignee: '何平',
    mobile: '153****2288',
    productName: '皇冠HG0182',
    unitPrice: 89,
    quantity: 2,
    orderAmount: 178,
    address: '黑龙江省哈尔滨市道里区中央大街',
    paymentMethod: '微信支付',
    orderStatus: '待打包',
  },
  {
    id: 'ORD20251230016',
    customerId: 'K2604210349432034',
    customerName: '谭****息',
    orderTime: '2026-03-05 16:50:00',
    createdBy: '陈敏',
    consignee: '苗*',
    mobile: '176****6121',
    productName: '新品B样品包',
    unitPrice: 860,
    quantity: 3,
    orderAmount: 2580,
    address: '阿尔巴尼亚都拉斯港保税库 3 区',
    paymentMethod: '银行转账',
    orderStatus: '其他状态',
  },
  {
    id: 'ORD20251230018',
    customerId: 'K2604210349432034',
    customerName: '谭****息',
    orderTime: '2026-04-04 09:15:00',
    createdBy: '陈敏',
    consignee: '苗*',
    mobile: '176****6121',
    productName: 'A产品组合补货',
    unitPrice: 1460,
    quantity: 4,
    orderAmount: 5840,
    address: '阿尔巴尼亚都拉斯港保税库 3 区',
    paymentMethod: '支付宝',
    orderStatus: '待发货',
  },
  {
    id: 'ORD20251230024',
    customerId: 'K2604211152018593',
    customerName: '谭*******息',
    orderTime: '2026-01-18 18:00:00',
    createdBy: '陈敏',
    consignee: '林*',
    mobile: '139****1123',
    productName: '预售样板确认单',
    unitPrice: 1260,
    quantity: 2,
    orderAmount: 2520,
    address: '奥兰群岛跨境集货点 2 号仓',
    paymentMethod: '银行转账',
    orderStatus: '待确认',
  },
  {
    id: 'ORD20251230028',
    customerId: 'K2604211152018593',
    customerName: '谭*******息',
    orderTime: '2026-03-09 10:40:00',
    createdBy: '陈敏',
    consignee: '林*',
    mobile: '139****1123',
    productName: '预售补样订单',
    unitPrice: 1350,
    quantity: 2,
    orderAmount: 2700,
    address: '奥兰群岛跨境集货点 2 号仓',
    paymentMethod: '微信支付',
    orderStatus: '待发货',
  },
  {
    id: 'ORD20251230029',
    customerId: 'K2604211152018593',
    customerName: '谭*******息',
    orderTime: '2026-04-12 14:22:00',
    createdBy: '陈敏',
    consignee: '林*',
    mobile: '139****1123',
    productName: '周度复购小单',
    unitPrice: 2600,
    quantity: 1,
    orderAmount: 2600,
    address: '奥兰群岛跨境集货点 2 号仓',
    paymentMethod: '支付宝',
    orderStatus: '已完成',
  },
  {
    id: 'ORD20251230030',
    customerId: 'K2604211152018593',
    customerName: '谭*******息',
    orderTime: '2026-04-20 19:30:00',
    createdBy: '陈敏',
    consignee: '林*',
    mobile: '139****1123',
    productName: '高频复购补单',
    unitPrice: 2400,
    quantity: 1,
    orderAmount: 2400,
    address: '奥兰群岛跨境集货点 2 号仓',
    paymentMethod: '银行转账',
    orderStatus: '待发货',
  },
];

const DEFAULT_PROGRESS_LOGS: TaskProgressLog[] = [
  {
    id: 'log-0001',
    taskId: 'task-013',
    customerId: 'K2604100347139123',
    submittedBy: '陈敏',
    submittedAt: '2025-11-10 18:30:00',
    progressPercent: 20,
    content: '先完成冬季陈列试单回访，客户开始重新观察新品节奏，恢复跟进频率。',
    status: '进行中',
    attachments: [],
  },
  {
    id: 'log-0002',
    taskId: 'task-013',
    customerId: 'K2604100347139123',
    submittedBy: '黄家颖',
    submittedAt: '2025-12-09 15:10:00',
    progressPercent: 38,
    content: '客户愿意尝试预售礼盒打样，补充了目标客群和陈列偏好。',
    status: '进行中',
    attachments: [],
  },
  {
    id: 'log-0003',
    taskId: 'task-014',
    customerId: 'K2604100347139123',
    submittedBy: '陈敏',
    submittedAt: '2026-01-14 11:05:00',
    progressPercent: 52,
    content: '首发基础套组反馈不错，客户开始接受加购组合的推荐逻辑。',
    status: '进行中',
    attachments: [],
  },
  {
    id: 'log-0004',
    taskId: 'task-012',
    customerId: 'K2604100347139123',
    submittedBy: '陈敏',
    submittedAt: '2026-02-12 17:45:00',
    progressPercent: 58,
    content: '母亲节档期开始预热，客户追加询问赠品和备货节奏，需要提前锁供应。',
    status: '进行中',
    attachments: [],
  },
  {
    id: 'log-0005',
    taskId: 'task-014',
    customerId: 'K2604100347139123',
    submittedBy: '黄家颖',
    submittedAt: '2026-03-07 10:25:00',
    progressPercent: 84,
    content: '老客补货和加购组合表现都在变好，客户明确希望 3 月继续推新品首发。',
    status: '进行中',
    attachments: [],
  },
  {
    id: 'log-001',
    taskId: 'task-001',
    customerId: 'K2604100347139123',
    submittedBy: '陈敏',
    submittedAt: '2026-04-21 16:10:00',
    progressPercent: 45,
    content: '首轮资料包已发送，客户希望增加终端陈列图片和搭配建议。',
    status: '进行中',
    attachments: [
      { id: 'att-001', type: 'image', name: '陈列图片', previewMode: 'cool' },
    ],
  },
  {
    id: 'log-002',
    taskId: 'task-001',
    customerId: 'K2604100347139123',
    submittedBy: '陈敏',
    submittedAt: '2026-04-22 10:20:00',
    progressPercent: 70,
    content: '已补发卖点页和首发陈列建议，客户计划本周确认首单清单。',
    status: '进行中',
    attachments: [
      { id: 'att-002', type: 'image', name: '订单截图', previewMode: 'neutral' },
    ],
  },
  {
    id: 'log-003',
    taskId: 'task-002',
    customerId: 'K2604100347139123',
    submittedBy: '黄家颖',
    submittedAt: '2026-04-22 15:00:00',
    progressPercent: 60,
    content: '客户确认首批货可拆分发运，正在等仓库回传可用库存。',
    status: '进行中',
    attachments: [],
  },
  {
    id: 'log-004',
    taskId: 'task-003',
    customerId: 'K2604100347139123',
    submittedBy: '陈敏',
    submittedAt: '2026-04-23 09:15:00',
    progressPercent: 50,
    content: '打板厂回图比预期晚一天，客户要求重新确认材质厚度，节点有风险。',
    status: '有风险',
    attachments: [
      { id: 'att-003', type: 'image', name: '打板图片', previewMode: 'warm' },
      { id: 'att-004', type: 'image', name: '订单截图', previewMode: 'neutral' },
    ],
  },
  {
    id: 'log-011',
    taskId: 'task-011',
    customerId: 'K2604100347139123',
    submittedBy: '黄家颖',
    submittedAt: '2026-04-23 11:20:00',
    progressPercent: 40,
    content: '赠品打样确认仍慢于预期，若明天下午前无法回样，需要切换备选供应商。',
    status: '有风险',
    attachments: [
      { id: 'att-011', type: 'image', name: '打样图片', previewMode: 'warm' },
    ],
  },
  {
    id: 'log-012',
    taskId: 'task-012',
    customerId: 'K2604100347139123',
    submittedBy: '陈敏',
    submittedAt: '2026-04-22 19:10:00',
    progressPercent: 68,
    content: '主推款和赠品清单已核对完成，正在确认最后一批补货数量。',
    status: '进行中',
    attachments: [],
  },
  {
    id: 'log-013',
    taskId: 'task-013',
    customerId: 'K2604100347139123',
    submittedBy: '陈敏',
    submittedAt: '2026-04-18 16:40:00',
    progressPercent: 100,
    content: '老客补货复盘完成，已输出下轮推荐组合和节奏建议。',
    status: '已完成',
    attachments: [],
  },
  {
    id: 'log-014',
    taskId: 'task-014',
    customerId: 'K2604100347139123',
    submittedBy: '黄家颖',
    submittedAt: '2026-04-17 18:20:00',
    progressPercent: 100,
    content: '加购组合二次触达已完成，补货订单均已落单并计入当前阶段目标。',
    status: '已完成',
    attachments: [
      { id: 'att-014', type: 'image', name: '订单截图', previewMode: 'neutral' },
    ],
  },
  {
    id: 'log-005',
    taskId: 'task-005',
    customerId: 'K2604210349432034',
    submittedBy: '阿塔咪',
    submittedAt: '2026-04-22 11:40:00',
    progressPercent: 65,
    content: '客户倾向先补A产品基础款，本周内给到补货确认。',
    status: '进行中',
    attachments: [],
  },
  {
    id: 'log-006',
    taskId: 'task-006',
    customerId: 'K2604210349432034',
    submittedBy: '陈敏',
    submittedAt: '2026-04-21 16:35:00',
    progressPercent: 100,
    content: '组合陈列建议已确认，客户认可并纳入门店执行清单。',
    status: '已完成',
    attachments: [
      { id: 'att-005', type: 'image', name: '陈列图片', previewMode: 'cool' },
    ],
  },
  {
    id: 'log-007',
    taskId: 'task-007',
    customerId: 'K2604210349432034',
    submittedBy: '陈敏',
    submittedAt: '2026-04-23 08:30:00',
    progressPercent: 40,
    content: '新品B样品已寄出，等待客户确认收样与初步反馈。',
    status: '进行中',
    attachments: [
      { id: 'att-006', type: 'image', name: '订单截图', previewMode: 'neutral' },
    ],
  },
  {
    id: 'log-008',
    taskId: 'task-008',
    customerId: 'K2604211152018593',
    submittedBy: '陈敏',
    submittedAt: '2026-04-22 18:00:00',
    progressPercent: 72,
    content: '样板已确认一版，客户想再看一次细节回图后决定是否下单。',
    status: '进行中',
    attachments: [
      { id: 'att-007', type: 'image', name: '打板图片', previewMode: 'warm' },
    ],
  },
  {
    id: 'log-009',
    taskId: 'task-009',
    customerId: 'K2604211152018593',
    submittedBy: '陈敏',
    submittedAt: '2026-04-23 10:10:00',
    progressPercent: 35,
    content: '客户还在比较价格方案，今天需要再次催确认，否则会影响预售上架节奏。',
    status: '有风险',
    attachments: [],
  },
  {
    id: 'log-010',
    taskId: 'task-010',
    customerId: 'K2604211152018593',
    submittedBy: '陈敏',
    submittedAt: '2026-04-22 20:30:00',
    progressPercent: 100,
    content: '本周复购复盘完成，整理出下周推荐组合与触达建议。',
    status: '已完成',
    attachments: [],
  },
];

function getCustomerIdFromLocation(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_DETAIL.id;
  }
  const search = new URLSearchParams(window.location.search);
  return search.get('id') || DEFAULT_DETAIL.id;
}

function buildTrendPath(points: number[], width: number, height: number, offsetX = 0, offsetY = 0): string {
  const max = Math.max(...points, 1);
  return points
    .map((point, index) => {
      const x = offsetX + (width / Math.max(points.length - 1, 1)) * index;
      const y = offsetY + height - (point / max) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function parseDateValue(value: string): Date | null {
  if (!value) {
    return null;
  }
  const normalizedValue = value.includes(' ') ? value.replace(' ', 'T') : value;
  const date = new Date(normalizedValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toTimestamp(value: string): number {
  return parseDateValue(value)?.getTime() || 0;
}

function getMonthKey(value: string): string {
  const date = parseDateValue(value);
  if (!date) {
    return value.slice(0, 7);
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(monthKey: string): string {
  const month = Number(monthKey.slice(5, 7));
  return `${month || 0}月`;
}

function getRecentMonthKeys(anchorValue: string, count: number): string[] {
  const anchor = parseDateValue(anchorValue) || new Date();
  const keys: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(anchor.getFullYear(), anchor.getMonth() - offset, 1);
    keys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

function buildMonthlyAnalysisPoints(
  orders: OrderRecord[],
  progressLogs: TaskProgressLog[],
  monthKeys: string[],
): MonthlyAnalysisPoint[] {
  const monthMap = new Map(
    monthKeys.map((monthKey) => [
      monthKey,
      {
        monthKey,
        label: getMonthLabel(monthKey),
        orderAmount: 0,
        orderCount: 0,
        completedOrderAmount: 0,
        pendingOrderAmount: 0,
        completedOrderCount: 0,
        pendingOrderCount: 0,
        followUpCount: 0,
        productNames: [] as string[],
      },
    ]),
  );

  orders.forEach((order) => {
    const monthKey = getMonthKey(order.orderTime);
    const bucket = monthMap.get(monthKey);
    if (bucket) {
      bucket.orderAmount += order.orderAmount;
      bucket.orderCount += 1;
      if (isCompletedOrderStatus(order.orderStatus)) {
        bucket.completedOrderAmount += order.orderAmount;
        bucket.completedOrderCount += 1;
      } else {
        bucket.pendingOrderAmount += order.orderAmount;
        bucket.pendingOrderCount += 1;
      }
      if (order.productName) {
        bucket.productNames.push(order.productName);
      }
    }
  });

  progressLogs.forEach((log) => {
    const monthKey = getMonthKey(log.submittedAt);
    const bucket = monthMap.get(monthKey);
    if (bucket) {
      bucket.followUpCount += 1;
    }
  });

  return monthKeys.map((monthKey) => monthMap.get(monthKey) || {
    monthKey,
    label: getMonthLabel(monthKey),
    orderAmount: 0,
    orderCount: 0,
    completedOrderAmount: 0,
    pendingOrderAmount: 0,
    completedOrderCount: 0,
    pendingOrderCount: 0,
    followUpCount: 0,
    productNames: [] as string[],
  }).map((item) => ({
    monthKey: item.monthKey,
    label: item.label,
    orderAmount: item.orderAmount,
    orderCount: item.orderCount,
    completedOrderAmount: item.completedOrderAmount,
    pendingOrderAmount: item.pendingOrderAmount,
    completedOrderCount: item.completedOrderCount,
    pendingOrderCount: item.pendingOrderCount,
    followUpCount: item.followUpCount,
    productSummary: summarizeProductNames(item.productNames),
  }));
}

function isCompletedOrderStatus(status: string): boolean {
  return status === '已完成';
}

function formatDate(value: string): string {
  if (!value) {
    return '-';
  }
  const date = parseDateValue(value);
  if (!date) {
    return value.slice(0, 10) || '-';
  }
  const diffMs = new Date().getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays >= 0 && diffDays < 30) {
    return diffDays === 0 ? '今天' : `${diffDays}天前`;
  }
  return value.slice(0, 10);
}

function formatRecentPastDate(value: string): string {
  if (!value) {
    return '-';
  }
  const date = parseDateValue(value);
  if (!date) {
    return value.slice(0, 10) || '-';
  }
  const diffMs = new Date().getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays >= 0 && diffDays < 7) {
    return diffDays === 0 ? '今天' : `${diffDays}天前`;
  }
  return value.slice(0, 10);
}

function formatRelativeTime(value: string): string {
  if (!value) {
    return '-';
  }
  const date = parseDateValue(value);
  if (!date) {
    return value.slice(0, 10) || '-';
  }
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const timeStr = value.slice(11, 16);
  if (diffDays === 0) {
    return `今天 ${timeStr}`;
  }
  if (diffDays === 1) {
    return `昨天 ${timeStr}`;
  }
  if (diffDays < 30) {
    return `${diffDays}天前 ${timeStr}`;
  }
  return value.slice(0, 10);
}

function formatCurrency(value: number): string {
  return `¥${value.toLocaleString('zh-CN')}`;
}

function formatCompactCurrency(value: number): string {
  if (value >= 10000) {
    return `¥${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}万`;
  }
  return `¥${Math.round(value).toLocaleString('zh-CN')}`;
}

function getOrderCreatedBy(order: OrderRecord, fallbackName: string): string {
  return order.createdBy || fallbackName || '订单系统';
}

function buildOrderPurchaseSummary(order: OrderRecord): string {
  if (order.quantity > 1) {
    return `${order.productName}，共${order.quantity}件`;
  }
  return order.productName;
}

function summarizePurchasedItems(orders: OrderRecord[]): string {
  const productNames = uniqueIds(orders.map((item) => item.productName).filter(Boolean));
  return summarizeProductNames(productNames);
}

function summarizeProductNames(productNames: string[]): string {
  const uniqueProductNames = uniqueIds(productNames.filter(Boolean));
  if (uniqueProductNames.length === 0) {
    return '暂无关联下单';
  }
  if (uniqueProductNames.length === 1) {
    return uniqueProductNames[0];
  }
  if (uniqueProductNames.length === 2) {
    return `${uniqueProductNames[0]}、${uniqueProductNames[1]}`;
  }
  return `${uniqueProductNames.slice(0, 2).join('、')}等${uniqueProductNames.length}类商品`;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function uniqueIds(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function maskSensitiveText(value: string, head = 1, tail = 1): string {
  if (!value) {
    return '-';
  }
  if (value.includes('*') || value.length <= head + tail) {
    return value;
  }
  return `${value.slice(0, head)}${'*'.repeat(Math.min(12, Math.max(4, value.length - head - tail)))}${value.slice(-tail)}`;
}

function normalizeOrderRecord(raw: Record<string, unknown>): OrderRecord {
  return {
    id: String(raw.id || ''),
    customerId: String(raw.customer_id || raw['客户编号'] || ''),
    customerName: String(raw.customer_name || raw['客户名称'] || ''),
    orderTime: String(raw.order_time || raw['下单时间'] || ''),
    createdBy: String(
      raw.created_by || raw.createdBy || raw.order_created_by || raw.orderCreatedBy || raw['创建人'] || raw['下单创建人'] || '',
    ),
    consignee: String(raw.consignee || raw['收货人姓名'] || ''),
    mobile: String(raw.mobile || raw['手机号码'] || ''),
    productName: String(raw.product_name || raw['商品名称'] || ''),
    unitPrice: Number(raw.unit_price || raw['单价(元)'] || 0),
    quantity: Number(raw.quantity || raw['数量'] || 0),
    orderAmount: Number(raw.order_amount || raw['订单总额(元)'] || 0),
    address: String(raw.address || raw['收货地址'] || ''),
    paymentMethod: String(raw.payment_method || raw['支付方式'] || ''),
    orderStatus: String(raw.order_status || raw['订单状态'] || ''),
  };
}

function normalizeProductSpecRecord(raw: Record<string, unknown>): ProductSpecRecord {
  return {
    productName: String(raw.product_name || raw.productName || raw['商品名称'] || ''),
    styleCode: String(raw.style_code || raw.styleCode || raw['款式'] || ''),
    platingColor: String(raw.plating_color || raw.platingColor || raw['电镀色'] || ''),
    colorName: String(raw.color_name || raw.colorName || raw['颜色'] || ''),
  };
}

function normalizePresaleProductRecord(raw: Record<string, unknown>): PresaleProductRecord {
  const validStatuses: PresaleStatus[] = ['待打板', '打板中', '已打板', '已确认', '已转正品', '已废弃'];

  const normalizeCustomerRef = (c: Record<string, unknown>): CustomerRef => ({
    customerId: String(c['客户编号'] ?? c.customerId ?? c.customer_id ?? ''),
    customerName: String(c['客户名称'] ?? c.customerName ?? c.customer_name ?? ''),
  });

  const normalizeSpec = (s: Record<string, unknown>): PresaleSpecRecord => {
    const status = String(s['打板状态'] ?? s.proofingStatus ?? s.proofing_status ?? '待打板') as PresaleStatus;
    const customersRaw = s['关联客户'] ?? s.customers ?? s.associated_customers;
    const customers: CustomerRef[] = Array.isArray(customersRaw)
      ? customersRaw.map((c) => normalizeCustomerRef(c as Record<string, unknown>))
      : [];
    return {
      id: String(s.id ?? ''),
      platingColor: String(s['电镀颜色'] ?? s.platingColor ?? s.plating_color ?? ''),
      colorName: String(s['颜色名称'] ?? s.colorName ?? s.color_name ?? ''),
      proofingStatus: validStatuses.includes(status) ? status : '待打板',
      developmentProgress: Number(s['开发进度'] ?? s.developmentProgress ?? s.development_progress ?? 0),
      estimatedCompletionDate: String(s['预计完成日期'] ?? s.estimatedCompletionDate ?? s.estimated_completion_date ?? ''),
      canConvert: Boolean(s['是否可转正品'] ?? s.canConvert ?? s.can_convert ?? false),
      customers,
    };
  };

  const sourceType = (String(raw['产品来源'] ?? raw.sourceType ?? raw.source_type ?? 'new')) as 'new' | 'existing';
  const specsRaw = raw['规格列表'] ?? raw.specs ?? raw.spec_list;
  const specs: PresaleSpecRecord[] = Array.isArray(specsRaw)
    ? specsRaw.map((s) => normalizeSpec(s as Record<string, unknown>))
    : [];

  return {
    id: String(raw.id ?? ''),
    productName: String(raw['产品名称'] ?? raw.productName ?? raw.product_name ?? ''),
    category: String(raw['分类'] ?? raw.category ?? '皇冠'),
    styleCode: String(raw['款号'] ?? raw.styleCode ?? raw.style_code ?? ''),
    designImage: String(raw['设计图'] ?? raw.designImage ?? raw.design_image ?? ''),
    sourceType: sourceType === 'existing' ? 'existing' : 'new',
    existingProductId: String(raw['现有产品编号'] ?? raw.existingProductId ?? raw.existing_product_id ?? ''),
    supplierId: String(raw['供应商编号'] ?? raw.supplierId ?? raw.supplier_id ?? ''),
    supplierName: String(raw['供应商名称'] ?? raw.supplierName ?? raw.supplier_name ?? ''),
    supplierContact: String(raw['供应商联系人'] ?? raw.supplierContact ?? raw.supplier_contact ?? ''),
    supplierPhone: String(raw['供应商电话'] ?? raw.supplierPhone ?? raw.supplier_phone ?? ''),
    createdDate: String(raw['创建日期'] ?? raw.createdDate ?? raw.created_date ?? ''),
    createdBy: String(raw['创建人'] ?? raw.createdBy ?? raw.created_by ?? ''),
    note: String(raw['备注'] ?? raw.note ?? ''),
    linkedOrderId: String(raw['关联订单编号'] ?? raw.linkedOrderId ?? raw.linked_order_id ?? ''),
    linkedTaskId: String(raw['关联任务编号'] ?? raw.linkedTaskId ?? raw.linked_task_id ?? ''),
    specs,
  };
}

function normalizeDetailRecord(raw: Record<string, unknown>): DetailRecord {
  const trendPointsSource = Array.isArray(raw.trend_points || raw.trendPoints)
    ? ((raw.trend_points || raw.trendPoints) as unknown[])
    : DEFAULT_DETAIL.trendPoints;

  return {
    id: String(raw.id || ''),
    displayName: String(raw.display_name || raw.displayName || ''),
    owner: String(raw.owner || ''),
    followUpBy: String(raw.follow_up_by || raw.followUpBy || ''),
    customerType: String(raw.customer_type || raw.customerType || ''),
    manualLevel: String(raw.manual_level || raw.manualLevel || '-'),
    annualAmount: String(raw.annual_amount || raw.annualAmount || '¥0'),
    autoLevel: String(raw.auto_level || raw.autoLevel || '-'),
    region: String(raw.region || '-'),
    website: String(raw.website || '-'),
    address: String(raw.address || '-'),
    note: String(raw.note || '-'),
    orderRemark: String(raw.order_remark || raw.orderRemark || '-'),
    createdAt: String(raw.created_at || raw.createdAt || ''),
    lastFollowAt: String(raw.last_follow_at || raw.lastFollowAt || '-'),
    lastOrderAt: String(raw.last_order_at || raw.lastOrderAt || '-'),
    tags: Array.isArray(raw.tags) ? raw.tags.map((item) => String(item)) : [],
    receiver: String(raw.receiver || '-'),
    phone: String(raw.phone || '-'),
    shippingAddress: String(raw.shipping_address || raw.shippingAddress || '-'),
    trendPoints: trendPointsSource.map((item: unknown) => Number(item)),
    consumePercent: Number(raw.consume_percent || raw.consumePercent || DEFAULT_DETAIL.consumePercent),
  };
}

function normalizeShippingAddressRecord(raw: Record<string, unknown>, fallbackCustomerId: string): ShippingAddressRecord {
  return {
    id: String(raw.id || raw.address_id || raw.addressId || makeId('addr')),
    customerId: String(raw.customer_id || raw.customerId || fallbackCustomerId),
    receiver: String(raw.receiver || raw.consignee || raw['收货人'] || raw['收货人姓名'] || ''),
    mobile: String(raw.mobile || raw.phone || raw['联系方式'] || raw['手机号码'] || ''),
    region: String(raw.region || raw.country_region || raw.countryRegion || raw['国家地区'] || ''),
    detailAddress: String(
      raw.detail_address ||
        raw.detailAddress ||
        raw.shipping_address ||
        raw.shippingAddress ||
        raw.address ||
        raw['详细地址'] ||
        raw['收货地址'] ||
        '',
    ),
  };
}

function normalizeContactRecord(raw: Record<string, unknown>, fallbackCustomerId: string): ContactRecord {
  return {
    id: String(raw.id || raw.contact_id || raw.contactId || makeId('contact')),
    customerId: String(raw.customer_id || raw.customerId || fallbackCustomerId),
    name: String(raw.name || raw.contact_name || raw.contactName || raw['联系人'] || ''),
    email: String(raw.email || raw.mail || raw['邮箱'] || ''),
    position: String(raw.position || raw.job_title || raw.jobTitle || raw['职位'] || ''),
    socialPlatform: String(raw.social_platform || raw.socialPlatform || raw['社交平台'] || ''),
    socialAccount: String(raw.social_account || raw.socialAccount || raw['社交账号'] || ''),
    phonePrefix: String(raw.phone_prefix || raw.phonePrefix || raw['电话区号'] || '+86'),
    phone: String(raw.phone || raw.mobile || raw['联系电话'] || raw['手机号码'] || ''),
    birthday: String(raw.birthday || raw.birth_date || raw.birthDate || raw['生日'] || ''),
    gender: String(raw.gender || raw['性别'] || ''),
    cardName: String(raw.card_name || raw.cardName || raw.avatar_name || raw.avatarName || raw['名片/头像'] || ''),
    remark: String(raw.remark || raw.note || raw['备注'] || ''),
  };
}

function normalizeGoalTarget(raw: Record<string, unknown>): GoalTarget {
  const linkedOrderIdsSource = Array.isArray(raw.linked_order_ids || raw.linkedOrderIds)
    ? ((raw.linked_order_ids || raw.linkedOrderIds) as unknown[])
    : [];

  return {
    id: String(raw.id || ''),
    customerId: String(raw.customer_id || raw.customerId || ''),
    title: String(raw.title || ''),
    goalType: (raw.goal_type || raw.goalType || '金额目标') as GoalType,
    owner: String(raw.owner || ''),
    startDate: String(raw.start_date || raw.startDate || TODAY),
    endDate: String(raw.end_date || raw.endDate || TODAY),
    status: (raw.status || '进行中') as GoalStatus,
    targetAmount:
      raw.target_amount === undefined && raw.targetAmount === undefined
        ? undefined
        : Number(raw.target_amount || raw.targetAmount || 0),
    currentAmount:
      raw.current_amount === undefined && raw.currentAmount === undefined
        ? undefined
        : Number(raw.current_amount || raw.currentAmount || 0),
    summary: String(raw.summary || ''),
    linkedOrderIds: linkedOrderIdsSource.map((item: unknown) => String(item)),
  };
}

function normalizeTaskItem(raw: Record<string, unknown>): TaskItem {
  const linkedOrderIdsSource = Array.isArray(raw.linked_order_ids || raw.linkedOrderIds)
    ? ((raw.linked_order_ids || raw.linkedOrderIds) as unknown[])
    : [];

  return {
    id: String(raw.id || ''),
    goalId: String(raw.goal_id || raw.goalId || ''),
    customerId: String(raw.customer_id || raw.customerId || ''),
    title: String(raw.title || ''),
    taskType: (raw.task_type || raw.taskType || '其他') as TaskType,
    assignee: String(raw.assignee || ''),
    dueDate: String(raw.due_date || raw.dueDate || TODAY),
    status: (raw.status || '未开始') as TaskStatus,
    priority: (raw.priority || '中') as TaskPriority,
    description: String(raw.description || ''),
    linkedOrderIds: linkedOrderIdsSource.map((item: unknown) => String(item)),
    latestProgressAt: String(raw.latest_progress_at || raw.latestProgressAt || ''),
  };
}

function normalizeProgressLog(raw: Record<string, unknown>): TaskProgressLog {
  const attachments = Array.isArray(raw.attachments)
    ? raw.attachments.map((item, index) => {
        const attachment = item as Record<string, unknown>;
        return {
          id: String(attachment.id || `attachment-${index}`),
          type: 'image' as const,
          name: String(attachment.name || '图片附件'),
          previewMode: (attachment.preview_mode || attachment.previewMode || 'neutral') as AttachmentPreviewMode,
        };
      })
    : [];

  return {
    id: String(raw.id || ''),
    taskId: String(raw.task_id || raw.taskId || ''),
    customerId: String(raw.customer_id || raw.customerId || ''),
    submittedBy: String(raw.submitted_by || raw.submittedBy || ''),
    submittedAt: String(raw.submitted_at || raw.submittedAt || ''),
    progressPercent: Number(raw.progress_percent || raw.progressPercent || 0),
    content: String(raw.content || ''),
    status: (raw.status || '进行中') as TaskStatus,
    attachments,
  };
}

function getRawList(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
  }
  if (value && typeof value === 'object' && Array.isArray((value as { records?: unknown[] }).records)) {
    return (value as { records: unknown[] }).records.filter(
      (item): item is Record<string, unknown> => typeof item === 'object' && item !== null,
    );
  }
  return [];
}

function resolveCustomerDetail(source: unknown, customerId: string): DetailRecord {
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    const objectSource = source as Record<string, unknown>;
    if (typeof objectSource.id === 'string') {
      return normalizeDetailRecord(objectSource);
    }
    if (objectSource[customerId] && typeof objectSource[customerId] === 'object') {
      return normalizeDetailRecord(objectSource[customerId] as Record<string, unknown>);
    }
  }

  const sourceList = getRawList(source).map(normalizeDetailRecord);
  const matched = sourceList.find((item) => item.id === customerId);
  return matched || DETAIL_RECORDS[customerId] || DEFAULT_DETAIL;
}

function resolveGoalTargets(source: unknown, customerId: string): GoalTarget[] {
  const sourceList = getRawList(source).map(normalizeGoalTarget);
  const filtered = sourceList.filter((item) => item.customerId === customerId);
  return filtered.length > 0 ? filtered : DEFAULT_GOALS.filter((item) => item.customerId === customerId);
}

function resolveTaskItems(source: unknown, customerId: string): TaskItem[] {
  const sourceList = getRawList(source).map(normalizeTaskItem);
  const filtered = sourceList.filter((item) => item.customerId === customerId);
  return filtered.length > 0 ? filtered : DEFAULT_TASKS.filter((item) => item.customerId === customerId);
}

function resolveProgressLogs(source: unknown, customerId: string): TaskProgressLog[] {
  const sourceList = getRawList(source).map(normalizeProgressLog);
  const filtered = sourceList.filter((item) => item.customerId === customerId);
  return filtered.length > 0 ? filtered : DEFAULT_PROGRESS_LOGS.filter((item) => item.customerId === customerId);
}

function resolveCustomerOrders(source: unknown, customerId: string): OrderRecord[] {
  const sourceList = getRawList(source).map(normalizeOrderRecord);
  const filtered = sourceList.filter((item) => item.customerId === customerId);
  if (filtered.length > 0) {
    return filtered.sort((left, right) => toTimestamp(right.orderTime) - toTimestamp(left.orderTime));
  }
  const fallback = [...DEFAULT_ORDERS, ...ordersDb.records.map((item) => normalizeOrderRecord(item as Record<string, unknown>))]
    .filter((item, index, list) => list.findIndex((current) => current.id === item.id) === index)
    .filter((item) => item.customerId === customerId);
  return fallback.sort((left, right) => toTimestamp(right.orderTime) - toTimestamp(left.orderTime));
}

function resolveProductSpecs(source: unknown): ProductSpecRecord[] {
  const sourceList = getRawList(source)
    .map(normalizeProductSpecRecord)
    .filter((item) => item.productName);
  return sourceList.length > 0 ? sourceList : DEFAULT_PRODUCT_SPECS;
}

function getPurchaseStructureLabel(spec: ProductSpecRecord | undefined, dimension: PurchaseStructureDimension): string {
  if (dimension === 'platingColor') {
    return spec?.platingColor || '未标注电镀色';
  }
  if (dimension === 'colorName') {
    return spec?.colorName || '未标注颜色';
  }
  return spec?.styleCode || '未标注款式';
}

function buildPurchaseStructureItems(
  orders: OrderRecord[],
  specs: ProductSpecRecord[],
  dimension: PurchaseStructureDimension,
): PurchaseStructureItem[] {
  const totalAmount = orders.reduce((sum, item) => sum + item.orderAmount, 0);
  const specMap = new Map(specs.map((item) => [item.productName, item] as const));
  const bucketMap = new Map<
    string,
    {
      key: string;
      label: string;
      orderCount: number;
      quantity: number;
      amount: number;
      productNames: Set<string>;
    }
  >();

  orders.forEach((order) => {
    const label = getPurchaseStructureLabel(specMap.get(order.productName), dimension);
    const key = `${dimension}-${label}`;
    const current =
      bucketMap.get(key) ||
      {
        key,
        label,
        orderCount: 0,
        quantity: 0,
        amount: 0,
        productNames: new Set<string>(),
      };

    current.orderCount += 1;
    current.quantity += order.quantity;
    current.amount += order.orderAmount;
    current.productNames.add(order.productName);
    bucketMap.set(key, current);
  });

  return Array.from(bucketMap.values())
    .map((item) => ({
      key: item.key,
      label: item.label,
      orderCount: item.orderCount,
      productCount: item.productNames.size,
      quantity: item.quantity,
      amount: item.amount,
      share: totalAmount > 0 ? item.amount / totalAmount : 0,
    }))
    .sort((left, right) => {
      if (right.amount !== left.amount) {
        return right.amount - left.amount;
      }
      if (right.orderCount !== left.orderCount) {
        return right.orderCount - left.orderCount;
      }
      return left.label.localeCompare(right.label, 'zh-CN');
    })
    .slice(0, PURCHASE_STRUCTURE_TOP_LIMIT);
}

function resolveShippingAddresses(source: unknown, customerId: string, detail: DetailRecord): ShippingAddressRecord[] {
  const sourceList = getRawList(source).map((item) => normalizeShippingAddressRecord(item, customerId));
  const filtered = sourceList.filter((item) => item.customerId === customerId);
  if (filtered.length > 0) {
    return filtered;
  }

  const defaults = DEFAULT_SHIPPING_ADDRESSES.filter((item) => item.customerId === customerId);
  if (defaults.length > 0) {
    return defaults;
  }

  return [
    {
      id: 'addr-default',
      customerId,
      receiver: detail.receiver,
      mobile: detail.phone,
      region: detail.region,
      detailAddress: detail.shippingAddress || detail.address,
    },
  ];
}

function resolveContacts(source: unknown, customerId: string, detail: DetailRecord): ContactRecord[] {
  const sourceList = getRawList(source).map((item) => normalizeContactRecord(item, customerId));
  const filtered = sourceList.filter((item) => item.customerId === customerId);
  if (filtered.length > 0) {
    return filtered;
  }

  const defaults = DEFAULT_CONTACTS.filter((item) => item.customerId === customerId);
  if (defaults.length > 0) {
    return defaults;
  }

  return [
    {
      id: 'contact-default',
      customerId,
      name: detail.receiver,
      email: '',
      position: detail.customerType,
      socialPlatform: '微信',
      socialAccount: '',
      phonePrefix: '+86',
      phone: detail.phone,
      birthday: '',
      gender: '',
      cardName: '',
      remark: detail.note,
    },
  ];
}

function resolveDefaultGoalId(goals: GoalTarget[]): string {
  return goals.find((item) => item.status === '进行中')?.id || goals[0]?.id || '';
}

function getTaskLatestLog(progressLogs: TaskProgressLog[], taskId: string): TaskProgressLog | undefined {
  return progressLogs
    .filter((item) => item.taskId === taskId)
    .sort((left, right) => toTimestamp(right.submittedAt) - toTimestamp(left.submittedAt))[0];
}

function isTaskOverdue(task: TaskItem): boolean {
  return task.status !== '已完成' && toTimestamp(task.dueDate) < toTimestamp(TODAY);
}

function formatDueDate(task: TaskItem): string {
  if (!task.dueDate) {
    return '-';
  }
  const date = parseDateValue(task.dueDate);
  if (!date) {
    return task.dueDate.slice(0, 10) || '-';
  }
  const todayTs = toTimestamp(TODAY);
  const dueTs = date.getTime();
  const diffDays = Math.floor((todayTs - dueTs) / (1000 * 60 * 60 * 24));
  if (Math.abs(diffDays) < 30) {
    if (diffDays === 0) return '今天';
    if (diffDays > 0) return `${diffDays}天前`;
    return `${Math.abs(diffDays)}天后`;
  }
  return task.dueDate.slice(0, 10);
}

function getGoalTaskSummary(goal: GoalTarget, tasks: TaskItem[]): { headline: string; progressText: string; percent: number } {
  const scopedTasks = tasks.filter((item) => item.goalId === goal.id);
  const completedCount = scopedTasks.filter((item) => item.status === '已完成').length;
  if (goal.goalType === '金额目标') {
    const target = goal.targetAmount || 0;
    const current = goal.currentAmount || 0;
    const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    return {
      headline: `${completedCount}/${scopedTasks.length || 0}个任务完成`,
      progressText: `金额达成${formatCurrency(current)}/${formatCurrency(target)}`,
      percent,
    };
  }

  const percent = scopedTasks.length > 0 ? Math.round((completedCount / scopedTasks.length) * 100) : 0;
  return {
    headline: `${completedCount}/${scopedTasks.length || 0}个任务完成`,
    progressText: '',
    percent,
  };
}

function getGoalLinkedOrderCount(goal: GoalTarget, tasks: TaskItem[]): number {
  return uniqueIds([
    ...goal.linkedOrderIds,
    ...tasks.filter((item) => item.goalId === goal.id).flatMap((item) => item.linkedOrderIds),
  ]).length;
}

function getStatusClass(status: GoalStatus | TaskStatus): string {
  if (status === '已完成') {
    return 'is-done';
  }
  if (status === '有风险') {
    return 'is-risk';
  }
  if (status === '未开始') {
    return 'is-pending';
  }
  return 'is-active';
}

function getPriorityClass(priority: TaskPriority): string {
  if (priority === '高') {
    return 'is-high';
  }
  if (priority === '低') {
    return 'is-low';
  }
  return 'is-medium';
}

function getPriorityWeight(priority: TaskPriority): number {
  if (priority === '高') {
    return 3;
  }
  if (priority === '中') {
    return 2;
  }
  return 1;
}

function getTaskLinkedOrderIds(task: TaskItem): string[] {
  return uniqueIds(task.linkedOrderIds);
}

function getTaskLinkedOrderAmount(task: TaskItem, orders: OrderRecord[]): number {
  const linkedOrderIds = getTaskLinkedOrderIds(task);
  return orders.reduce((sum, order) => (linkedOrderIds.includes(order.id) ? sum + order.orderAmount : sum), 0);
}

function createDefaultGoalForm(owner: string): GoalFormState {
  return {
    title: '',
    goalType: '金额目标',
    owner,
    endDate: '2026-05-10',
    targetAmount: '50000',
    currentAmount: '0',
    status: '进行中',
    summary: '',
  };
}

function createDefaultTaskForm(assignee: string): TaskFormState {
  return {
    title: '',
    taskType: '新品推送',
    assignee,
    dueDate: '2026-04-28',
    status: '未开始',
    priority: '中',
    description: '',
  };
}

function createDefaultProgressForm(operatorName: string): ProgressFormState {
  return {
    submittedBy: operatorName,
    status: '进行中',
    content: '',
    attachmentPresetIds: [],
  };
}

function createDefaultShippingAddressForm(detail: DetailRecord): ShippingAddressFormState {
  return {
    receiver: '',
    mobile: '',
    region: detail.region === '-' ? '' : detail.region,
    detailAddress: '',
  };
}

function createDefaultTagForm(): TagFormState {
  return {
    name: '',
  };
}

function createDefaultContactForm(): ContactFormState {
  return {
    name: '',
    email: '',
    position: '',
    socialPlatform: '',
    socialAccount: '',
    phonePrefix: '+86',
    phone: '',
    birthday: '',
    gender: '',
    cardName: '',
    remark: '',
  };
}

const Component = forwardRef<AxureHandle, AxureProps>(function CrmCustomerDetail(innerProps, ref) {
  const dataSource = innerProps?.data || {};
  const configSource = innerProps?.config || {};
  const onEventHandler = typeof innerProps?.onEvent === 'function' ? innerProps.onEvent : () => undefined;
  const operatorName =
    typeof configSource.operator_name === 'string' && configSource.operator_name
      ? configSource.operator_name
      : '阿塔咪';

  const customerId = getCustomerIdFromLocation();
  const initialDetail = resolveCustomerDetail(dataSource.customer_detail, customerId);
  const initialGoals = resolveGoalTargets(dataSource.goal_targets, customerId);
  const initialTasks = resolveTaskItems(dataSource.task_items, customerId);
  const initialProgressLogs = resolveProgressLogs(dataSource.task_progress_logs, customerId);
  const initialShippingAddresses = resolveShippingAddresses(
    dataSource.customer_shipping_addresses,
    customerId,
    initialDetail,
  );
  const initialContacts = resolveContacts(dataSource.customer_contacts, customerId, initialDetail);

  const [detail, setDetail] = useState<DetailRecord>(initialDetail);
  const [goals, setGoals] = useState<GoalTarget[]>(initialGoals);
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [progressLogs, setProgressLogs] = useState<TaskProgressLog[]>(initialProgressLogs);
  const [selectedGoalId, setSelectedGoalId] = useState<string>(resolveDefaultGoalId(initialGoals));
  const [activeTaskId, setActiveTaskId] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [isGoalListModalOpen, setIsGoalListModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'goal' | 'warehouse' | 'productCompare'>('goal');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isOrderOverviewModalOpen, setIsOrderOverviewModalOpen] = useState(false);
  const [isOrderBindModalOpen, setIsOrderBindModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isShippingAddressListOpen, setIsShippingAddressListOpen] = useState(false);
  const [isShippingAddressFormOpen, setIsShippingAddressFormOpen] = useState(false);
  const [isTagFormOpen, setIsTagFormOpen] = useState(false);
  const [editingShippingAddressId, setEditingShippingAddressId] = useState<string>('');
  const [isContactListOpen, setIsContactListOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string>('');
  const [goalForm, setGoalForm] = useState<GoalFormState>(createDefaultGoalForm(initialDetail.followUpBy));
  const [taskForm, setTaskForm] = useState<TaskFormState>(createDefaultTaskForm(initialDetail.followUpBy));
  const [editingTaskId, setEditingTaskId] = useState('');
  const [isDeleteTaskConfirmOpen, setIsDeleteTaskConfirmOpen] = useState(false);
  const [progressForm, setProgressForm] = useState<ProgressFormState>(createDefaultProgressForm(operatorName));
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddressRecord[]>(initialShippingAddresses);
  const [shippingAddressForm, setShippingAddressForm] = useState<ShippingAddressFormState>(
    createDefaultShippingAddressForm(initialDetail),
  );
  const [tagForm, setTagForm] = useState<TagFormState>(createDefaultTagForm());
  const [contacts, setContacts] = useState<ContactRecord[]>(initialContacts);
  const [contactForm, setContactForm] = useState<ContactFormState>(createDefaultContactForm());
  const [taskListFilter, setTaskListFilter] = useState<TaskListFilter>('all');
  const [taskNameKeyword, setTaskNameKeyword] = useState('');
  const [taskDueDateStart, setTaskDueDateStart] = useState('');
  const [taskDueDateEnd, setTaskDueDateEnd] = useState('');
  const [taskPrioritySortDirection, setTaskPrioritySortDirection] = useState<TaskPrioritySortDirection>('desc');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'progress' | 'order'>('all');
  const [timelineKeyword, setTimelineKeyword] = useState('');
  const [selectedTimelineEntryId, setSelectedTimelineEntryId] = useState<string | null>(null);
  const [hoveredAnalysisIndex, setHoveredAnalysisIndex] = useState<number | null>(null);
  const [activePurchaseDimension, setActivePurchaseDimension] = useState<PurchaseStructureDimension>('platingColor');
  const [isBasicInfoExpanded, setIsBasicInfoExpanded] = useState(false);
  const [isPresaleListOpen, setIsPresaleListOpen] = useState(false);

  const customerOrders = useMemo(
    () => resolveCustomerOrders(dataSource.customer_orders, customerId),
    [dataSource.customer_orders, customerId],
  );
  const productSpecs = useMemo(() => resolveProductSpecs(dataSource.product_specs), [dataSource.product_specs]);
  const customerPresaleProducts = useMemo(
    () => DEFAULT_PRESALE_PRODUCTS.filter((p) =>
      p.specs.some((s) => s.customers.some((c) => c.customerId === customerId)),
    ),
    [customerId],
  );

  useEffect(() => {
    if (!goals.some((item) => item.id === selectedGoalId)) {
      setSelectedGoalId(resolveDefaultGoalId(goals));
    }
  }, [goals, selectedGoalId]);

  useEffect(() => {
    const scopedTaskIds = tasks.filter((item) => item.goalId === selectedGoalId).map((item) => item.id);
    if (activeTaskId && !scopedTaskIds.includes(activeTaskId)) {
      setActiveTaskId(scopedTaskIds[0] || '');
      return;
    }
    if (!activeTaskId && scopedTaskIds[0]) {
      setActiveTaskId(scopedTaskIds[0]);
    }
  }, [activeTaskId, tasks, selectedGoalId]);

  useEffect(() => {
    if (selectedOrderId && !customerOrders.some((item) => item.id === selectedOrderId)) {
      setSelectedOrderId('');
    }
  }, [customerOrders, selectedOrderId]);

  useEffect(() => {
    setProgressForm(createDefaultProgressForm(operatorName));
  }, [operatorName]);

  const sortedGoals = useMemo(
    () => [...goals].sort((left, right) => toTimestamp(left.endDate) - toTimestamp(right.endDate)),
    [goals],
  );

  const selectedGoal = useMemo(
    () => goals.find((item) => item.id === selectedGoalId) || goals[0],
    [goals, selectedGoalId],
  );

  const goalTasks = useMemo(
    () => tasks.filter((item) => item.goalId === selectedGoal?.id),
    [selectedGoal?.id, tasks],
  );

  const filteredGoalTasks = useMemo(
    () => (taskListFilter === 'all' ? goalTasks : goalTasks.filter((item) => item.status === taskListFilter)),
    [goalTasks, taskListFilter],
  );

  const visibleGoalTasks = useMemo(() => {
    const normalizedKeyword = taskNameKeyword.trim().toLowerCase();
    return [...filteredGoalTasks]
      .filter((item) => {
        const matchesKeyword = normalizedKeyword ? item.title.toLowerCase().includes(normalizedKeyword) : true;
        const dueDateTimestamp = toTimestamp(item.dueDate);
        const matchesStartDate = taskDueDateStart ? dueDateTimestamp >= toTimestamp(taskDueDateStart) : true;
        const matchesEndDate = taskDueDateEnd ? dueDateTimestamp <= toTimestamp(taskDueDateEnd) : true;
        return matchesKeyword && matchesStartDate && matchesEndDate;
      })
      .sort((left, right) => {
        const priorityDiff =
          taskPrioritySortDirection === 'desc'
            ? getPriorityWeight(right.priority) - getPriorityWeight(left.priority)
            : getPriorityWeight(left.priority) - getPriorityWeight(right.priority);
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
        return 0;
      });
  }, [filteredGoalTasks, taskDueDateEnd, taskDueDateStart, taskNameKeyword, taskPrioritySortDirection]);

  useEffect(() => {
    if (visibleGoalTasks.length === 0) {
      return;
    }
    if (!visibleGoalTasks.some((item) => item.id === activeTaskId)) {
      setActiveTaskId(visibleGoalTasks[0].id);
    }
  }, [activeTaskId, visibleGoalTasks]);

  const activeTask = useMemo(
    () => tasks.find((item) => item.id === activeTaskId) || goalTasks[0],
    [activeTaskId, goalTasks, tasks],
  );

  const activeTaskLogs = useMemo(
    () =>
      progressLogs
        .filter((item) => item.taskId === activeTask?.id)
        .sort((left, right) => toTimestamp(right.submittedAt) - toTimestamp(left.submittedAt)),
    [activeTask?.id, progressLogs],
  );

  const selectedGoalLinkedOrderIds = useMemo(
    () =>
      uniqueIds([
        ...(selectedGoal?.linkedOrderIds || []),
        ...goalTasks.flatMap((item) => item.linkedOrderIds),
      ]),
    [goalTasks, selectedGoal?.linkedOrderIds],
  );

  const orderedCustomerOrders = useMemo(() => {
    return [...customerOrders].sort((left, right) => {
      const leftPinned = selectedGoalLinkedOrderIds.includes(left.id) ? 1 : 0;
      const rightPinned = selectedGoalLinkedOrderIds.includes(right.id) ? 1 : 0;
      if (leftPinned !== rightPinned) {
        return rightPinned - leftPinned;
      }
      return toTimestamp(right.orderTime) - toTimestamp(left.orderTime);
    });
  }, [customerOrders, selectedGoalLinkedOrderIds]);

  const activeTaskOrders = useMemo(
    () => orderedCustomerOrders.filter((order) => activeTask?.linkedOrderIds.includes(order.id)),
    [activeTask?.linkedOrderIds, orderedCustomerOrders],
  );

  const activeTaskOrderAmount = useMemo(
    () => activeTaskOrders.reduce((sum, order) => sum + order.orderAmount, 0),
    [activeTaskOrders],
  );

  const activeTaskPurchaseSummary = useMemo(
    () => summarizePurchasedItems(activeTaskOrders),
    [activeTaskOrders],
  );

  const activeTaskTimelineEntries = useMemo<TaskTimelineEntry[]>(
    () =>
      activeTask
        ? [
            ...activeTaskLogs.map((log) => ({
              id: log.id,
              type: 'progress' as const,
              happenedAt: log.submittedAt,
              title: activeTask.title,
              submittedBy: log.submittedBy,
              status: log.status,
              content: log.content,
              attachments: log.attachments,
            })),
            ...activeTaskOrders.map((order) => ({
              id: `order-${order.id}`,
              type: 'order' as const,
              happenedAt: order.orderTime,
              title: `新增订单 · ${order.productName}`,
              createdBy: getOrderCreatedBy(order, activeTask.assignee || selectedGoal?.owner || detail.followUpBy),
              orderAmount: order.orderAmount,
              orderStatus: order.orderStatus,
              content: `${getOrderCreatedBy(order, activeTask.assignee || selectedGoal?.owner || detail.followUpBy)}创建订单，购买${buildOrderPurchaseSummary(order)}。`,
              order,
            })),
          ].sort((left, right) => toTimestamp(right.happenedAt) - toTimestamp(left.happenedAt))
        : [],
    [activeTask, activeTaskLogs, activeTaskOrders, detail.followUpBy, selectedGoal?.owner],
  );

  const filteredTimelineEntries = useMemo(() => {
    let entries =
      timelineFilter === 'all'
        ? activeTaskTimelineEntries
        : activeTaskTimelineEntries.filter((entry) => entry.type === timelineFilter);
    if (timelineKeyword.trim()) {
      const keyword = timelineKeyword.trim().toLowerCase();
      entries = entries.filter((entry) => {
        const text =
          entry.type === 'progress'
            ? `${entry.submittedBy} ${entry.status} ${entry.content} ${entry.attachments.map((a) => a.name).join(' ')}`
            : `${entry.createdBy} ${entry.orderStatus} ${entry.content} ${entry.title}`;
        return text.toLowerCase().includes(keyword);
      });
    }
    return entries;
  }, [activeTaskTimelineEntries, timelineFilter, timelineKeyword]);

  useEffect(() => {
    if (filteredTimelineEntries.length > 0) {
      const firstId = filteredTimelineEntries[0].id;
      setSelectedTimelineEntryId((prev) => {
        return filteredTimelineEntries.some((e) => e.id === prev) ? prev : firstId;
      });
    } else {
      setSelectedTimelineEntryId(null);
    }
  }, [filteredTimelineEntries]);

  const analysisMonthKeys = useMemo(() => getRecentMonthKeys(TODAY, ANALYSIS_MONTH_COUNT), []);
  const analysisPoints = useMemo(
    () => buildMonthlyAnalysisPoints(customerOrders, progressLogs, analysisMonthKeys),
    [analysisMonthKeys, customerOrders, progressLogs],
  );
  const analysisDateRange = `${analysisMonthKeys[0] || '-'} - ${analysisMonthKeys[analysisMonthKeys.length - 1] || '-'}`;
  const analysisHasData = useMemo(
    () => analysisPoints.some((item) => item.orderAmount > 0 || item.followUpCount > 0),
    [analysisPoints],
  );
  const analysisOrderMax = useMemo(() => Math.max(...analysisPoints.map((item) => item.orderAmount), 1), [analysisPoints]);
  const analysisFollowUpMax = useMemo(
    () => Math.max(...analysisPoints.map((item) => item.followUpCount), 1),
    [analysisPoints],
  );
  const analysisDefaultIndex = useMemo(() => {
    const lastIndex = analysisPoints.length - 1;
    const lastActiveIndex = analysisPoints.reduce(
      (matchedIndex, item, index) => (item.orderAmount > 0 || item.followUpCount > 0 ? index : matchedIndex),
      -1,
    );
    return lastActiveIndex >= 0 ? lastActiveIndex : Math.max(lastIndex, 0);
  }, [analysisPoints]);
  const activeAnalysisIndex = hoveredAnalysisIndex ?? analysisDefaultIndex;
  const comboChartLeft = 52;
  const comboChartTop = 54;
  const comboChartWidth = 636;
  const comboChartHeight = 174;
  const comboChartStep = comboChartWidth / Math.max(analysisPoints.length, 1);
  const comboChartBaseY = comboChartTop + comboChartHeight;
  const comboChartOrderTicks = useMemo(
    () =>
      [1, 0.75, 0.5, 0.25, 0].map((ratio, index) => ({
        key: `order-tick-${index}`,
        y: comboChartTop + comboChartHeight * (1 - ratio),
        label: formatCompactCurrency(analysisOrderMax * ratio),
      })),
    [analysisOrderMax],
  );
  const comboChartFollowTicks = useMemo(
    () =>
      [1, 0.5, 0].map((ratio, index) => ({
        key: `follow-tick-${index}`,
        y: comboChartTop + comboChartHeight * (1 - ratio),
        label: `${Math.round(analysisFollowUpMax * ratio)}次`,
      })),
    [analysisFollowUpMax],
  );
  const comboChartLinePath = useMemo(
    () =>
      buildTrendPath(
        analysisPoints.map((item) => item.followUpCount),
        comboChartStep * Math.max(analysisPoints.length - 1, 0),
        comboChartHeight,
        comboChartLeft + comboChartStep / 2,
        comboChartTop,
      ),
    [analysisPoints, comboChartStep],
  );
  const comboChartBars = useMemo(
    () =>
      analysisPoints.map((point, index) => {
        const barWidth = Math.min(40, comboChartStep * 0.44);
        const barHeight = analysisOrderMax > 0 ? (point.orderAmount / analysisOrderMax) * comboChartHeight : 0;
        const completedBarHeight =
          analysisOrderMax > 0 ? (point.completedOrderAmount / analysisOrderMax) * comboChartHeight : 0;
        const pendingBarHeight =
          analysisOrderMax > 0 ? (point.pendingOrderAmount / analysisOrderMax) * comboChartHeight : 0;
        const x = comboChartLeft + comboChartStep * index + (comboChartStep - barWidth) / 2;
        const y = comboChartTop + comboChartHeight - barHeight;
        return {
          ...point,
          x,
          y,
          barWidth,
          barHeight,
          completedBarHeight,
          pendingBarHeight,
          completedY: comboChartBaseY - completedBarHeight,
          pendingY: y,
          centerX: comboChartLeft + comboChartStep * index + comboChartStep / 2,
          clipPathId: `crm-customer-detail-bar-clip-${point.monthKey}`,
        };
      }),
    [analysisOrderMax, analysisPoints, comboChartBaseY],
  );
  const comboChartLineDots = useMemo(
    () =>
      analysisPoints.map((point, index) => {
        const x = comboChartLeft + comboChartStep * index + comboChartStep / 2;
        const y =
          comboChartTop +
          comboChartHeight -
          (analysisFollowUpMax > 0 ? (point.followUpCount / analysisFollowUpMax) * comboChartHeight : 0);
        return { ...point, x, y };
      }),
    [analysisFollowUpMax, analysisPoints],
  );
  const comboChartAreaPath = useMemo(() => {
    if (comboChartLineDots.length === 0) {
      return '';
    }
    const first = comboChartLineDots[0];
    const last = comboChartLineDots[comboChartLineDots.length - 1];
    const path = comboChartLineDots
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' ');
    return `${path} L ${last.x.toFixed(2)} ${comboChartBaseY.toFixed(2)} L ${first.x.toFixed(2)} ${comboChartBaseY.toFixed(2)} Z`;
  }, [comboChartBaseY, comboChartLineDots]);
  const activeAnalysisPoint = comboChartLineDots[activeAnalysisIndex];
  const activeAnalysisBar = comboChartBars[activeAnalysisIndex];
  const analysisTooltipLeft = activeAnalysisBar
    ? `${Math.max(12, Math.min(88, (activeAnalysisBar.centerX / 720) * 100))}%`
    : '50%';
  const analysisTooltipAlignClass =
    activeAnalysisIndex <= 1
      ? 'is-left'
      : activeAnalysisIndex >= Math.max(analysisPoints.length - 2, 0)
        ? 'is-right'
        : 'is-center';
  useEffect(() => {
    if (hoveredAnalysisIndex !== null && hoveredAnalysisIndex >= analysisPoints.length) {
      setHoveredAnalysisIndex(null);
    }
  }, [analysisPoints.length, hoveredAnalysisIndex]);

  const purchaseStructureItems = useMemo(
    () => buildPurchaseStructureItems(customerOrders, productSpecs, activePurchaseDimension),
    [activePurchaseDimension, customerOrders, productSpecs],
  );

  const openTaskCount = tasks.filter((item) => item.status !== '已完成').length;
  const overdueTaskCount = tasks.filter((item) => isTaskOverdue(item)).length;
  const latestOrderAt = customerOrders[0]?.orderTime || detail.lastOrderAt;

  const coreFields = [
    ['客户编号', detail.id],
    ['归属', detail.owner],
    ['跟进人', detail.followUpBy],
  ];

  const basicFields = [
    ['客户类型', detail.customerType],
    ['手动层级', detail.manualLevel],
    ['自动层级', detail.autoLevel],
    ['国家地区', detail.region],
    ['公司官网', detail.website],
    ['公司地址', detail.address],
    ['创建时间', detail.createdAt],
    ['最近跟进时间', detail.lastFollowAt],
    ['最近下单时间', latestOrderAt],
  ];

  const selectedGoalTaskSummary = selectedGoal ? getGoalTaskSummary(selectedGoal, tasks) : null;
  const goalTaskCount = goalTasks.length;
  const goalTaskInProgressCount = goalTasks.filter((item) => item.status === '进行中').length;
  const goalTaskRiskCount = goalTasks.filter((item) => item.status === '有风险').length;
  const goalTaskDoneCount = goalTasks.filter((item) => item.status === '已完成').length;
  const taskFilterOptions: Array<{ key: TaskListFilter; label: string; count: number }> = [
    { key: 'all', label: '全部', count: goalTaskCount },
    { key: '进行中', label: '进行中', count: goalTaskInProgressCount },
    { key: '有风险', label: '有风险', count: goalTaskRiskCount },
    { key: '已完成', label: '已完成', count: goalTaskDoneCount },
  ];

  const profileSummaryCards = [
    { label: '近一年累计金额', value: detail.annualAmount, featured: true },
    { label: '累计订单', value: String(customerOrders.length), interactive: true },
  ];

  const activeShippingAddress = shippingAddresses.find((item) => item.id === editingShippingAddressId);
  const activeContact = contacts.find((item) => item.id === editingContactId);

  function emitEvent(name: string, payload?: Record<string, unknown>) {
    try {
      onEventHandler(name, payload ? JSON.stringify(payload) : undefined);
    } catch (error) {
      console.warn(`event ${name} failed`, error);
    }
  }

  function navigateBack() {
    emitEvent('on_back_to_list', { customer_id: detail.id });
    if (typeof window !== 'undefined') {
      window.location.href = '/prototypes/crm-customer-list';
    }
  }

  function handleSelectGoal(goalId: string) {
    setSelectedGoalId(goalId);
    setSelectedOrderId('');
    setTimelineFilter('all');
    emitEvent('on_select_goal', { customer_id: detail.id, goal_id: goalId });
  }

  function handleOpenTask(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }
    if (task.goalId !== selectedGoalId) {
      setSelectedGoalId(task.goalId);
    }
    setActiveTaskId(taskId);
    emitEvent('on_select_task', { customer_id: detail.id, goal_id: task.goalId, task_id: taskId });
  }

  function handleCreateProgressForTask(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }
    if (task.goalId !== selectedGoalId) {
      setSelectedGoalId(task.goalId);
    }
    setActiveTaskId(taskId);
    setProgressForm(createDefaultProgressForm(operatorName));
    setIsProgressModalOpen(true);
    emitEvent('on_select_task', { customer_id: detail.id, goal_id: task.goalId, task_id: taskId });
  }

  function openOrderOverviewModal() {
    setIsOrderOverviewModalOpen(true);
  }

  function closeOrderOverviewModal() {
    setIsOrderOverviewModalOpen(false);
  }

  function openGoalListModal() {
    setIsGoalListModalOpen(true);
  }

  function closeGoalListModal() {
    setIsGoalListModalOpen(false);
  }

  function toggleTaskPrioritySortDirection() {
    setTaskPrioritySortDirection((current) => (current === 'desc' ? 'asc' : 'desc'));
  }

  function openShippingAddressList() {
    setIsShippingAddressListOpen(true);
    emitEvent('on_open_shipping_addresses', {
      customer_id: detail.id,
      address_count: shippingAddresses.length,
    });
  }

  function closeShippingAddressList() {
    setIsShippingAddressListOpen(false);
    setIsShippingAddressFormOpen(false);
    setEditingShippingAddressId('');
    setShippingAddressForm(createDefaultShippingAddressForm(detail));
  }

  function openPresaleList() {
    setIsPresaleListOpen(true);
    emitEvent('on_open_presale_products', {
      customer_id: detail.id,
      presale_product_count: customerPresaleProducts.length,
    });
  }

  function closePresaleList() {
    setIsPresaleListOpen(false);
  }

  function openShippingAddressForm(address?: ShippingAddressRecord) {
    if (address) {
      setEditingShippingAddressId(address.id);
      setShippingAddressForm({
        receiver: address.receiver,
        mobile: address.mobile,
        region: address.region,
        detailAddress: address.detailAddress,
      });
    } else {
      setEditingShippingAddressId('');
      setShippingAddressForm(createDefaultShippingAddressForm(detail));
    }
    setIsShippingAddressFormOpen(true);
  }

  function closeShippingAddressForm() {
    setIsShippingAddressFormOpen(false);
    setEditingShippingAddressId('');
    setShippingAddressForm(createDefaultShippingAddressForm(detail));
  }

  function openTagForm() {
    setTagForm(createDefaultTagForm());
    setIsTagFormOpen(true);
  }

  function closeTagForm() {
    setIsTagFormOpen(false);
    setTagForm(createDefaultTagForm());
  }

  function handleCreateTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTag = tagForm.name.trim();
    if (!nextTag) {
      return;
    }
    if (detail.tags.includes(nextTag)) {
      closeTagForm();
      return;
    }

    setDetail((current) => ({
      ...current,
      tags: [...current.tags, nextTag],
    }));

    closeTagForm();
    emitEvent('on_create_customer_tag', {
      customer_id: detail.id,
      tag: nextTag,
    });
  }

  function handleSaveShippingAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextAddress: ShippingAddressRecord = {
      id: editingShippingAddressId || makeId('addr'),
      customerId: detail.id,
      receiver: shippingAddressForm.receiver || '未填写',
      mobile: shippingAddressForm.mobile || '未填写',
      region: shippingAddressForm.region || detail.region,
      detailAddress: shippingAddressForm.detailAddress || detail.shippingAddress || detail.address,
    };

    if (editingShippingAddressId) {
      setShippingAddresses((current) => current.map((item) => (item.id === editingShippingAddressId ? nextAddress : item)));
      emitEvent('on_update_shipping_address', {
        customer_id: detail.id,
        address_id: nextAddress.id,
      });
    } else {
      setShippingAddresses((current) => [nextAddress, ...current]);
      emitEvent('on_create_shipping_address', {
        customer_id: detail.id,
        address_id: nextAddress.id,
      });
    }

    closeShippingAddressForm();
  }

  function handleDeleteShippingAddress(addressId: string) {
    setShippingAddresses((current) => current.filter((item) => item.id !== addressId));
    if (editingShippingAddressId === addressId) {
      closeShippingAddressForm();
    }
    emitEvent('on_delete_shipping_address', {
      customer_id: detail.id,
      address_id: addressId,
    });
  }

  function openContactList() {
    setIsContactListOpen(true);
    emitEvent('on_open_contacts', {
      customer_id: detail.id,
      contact_count: contacts.length,
    });
  }

  function closeContactList() {
    setIsContactListOpen(false);
    setIsContactFormOpen(false);
    setEditingContactId('');
    setContactForm(createDefaultContactForm());
  }

  function openContactForm(contact?: ContactRecord) {
    if (contact) {
      setEditingContactId(contact.id);
      setContactForm({
        name: contact.name,
        email: contact.email,
        position: contact.position,
        socialPlatform: contact.socialPlatform,
        socialAccount: contact.socialAccount,
        phonePrefix: contact.phonePrefix,
        phone: contact.phone,
        birthday: contact.birthday,
        gender: contact.gender,
        cardName: contact.cardName,
        remark: contact.remark,
      });
    } else {
      setEditingContactId('');
      setContactForm(createDefaultContactForm());
    }
    setIsContactFormOpen(true);
  }

  function closeContactForm() {
    setIsContactFormOpen(false);
    setEditingContactId('');
    setContactForm(createDefaultContactForm());
  }

  function handleSaveContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextContact: ContactRecord = {
      id: editingContactId || makeId('contact'),
      customerId: detail.id,
      name: contactForm.name || '未填写',
      email: contactForm.email,
      position: contactForm.position || '-',
      socialPlatform: contactForm.socialPlatform,
      socialAccount: contactForm.socialAccount,
      phonePrefix: contactForm.phonePrefix || '+86',
      phone: contactForm.phone,
      birthday: contactForm.birthday,
      gender: contactForm.gender,
      cardName: contactForm.cardName,
      remark: contactForm.remark,
    };

    if (editingContactId) {
      setContacts((current) => current.map((item) => (item.id === editingContactId ? nextContact : item)));
      emitEvent('on_update_contact', {
        customer_id: detail.id,
        contact_id: nextContact.id,
      });
    } else {
      setContacts((current) => [nextContact, ...current]);
      emitEvent('on_create_contact', {
        customer_id: detail.id,
        contact_id: nextContact.id,
      });
    }

    closeContactForm();
  }

  function handleDeleteContact(contactId: string) {
    setContacts((current) => current.filter((item) => item.id !== contactId));
    if (editingContactId === contactId) {
      closeContactForm();
    }
    emitEvent('on_delete_contact', {
      customer_id: detail.id,
      contact_id: contactId,
    });
  }

  function closeOrderBindModal() {
    setIsOrderBindModalOpen(false);
  }

  function openOrderBindModal() {
    if (!activeTask) {
      return;
    }
    setIsOrderBindModalOpen(true);
  }

  function openProgressModal() {
    if (!activeTask) {
      return;
    }
    setProgressForm(createDefaultProgressForm(operatorName));
    setIsProgressModalOpen(true);
  }

  function closeProgressModal() {
    setIsProgressModalOpen(false);
    setProgressForm(createDefaultProgressForm(operatorName));
  }

  function closeGoalForm() {
    setIsGoalFormOpen(false);
    setGoalForm(createDefaultGoalForm(detail.followUpBy));
  }

  function closeTaskForm() {
    setIsTaskFormOpen(false);
    setEditingTaskId('');
    setTaskForm(createDefaultTaskForm(detail.followUpBy));
  }

  function handleEditTask(task: TaskItem) {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      taskType: task.taskType,
      assignee: task.assignee,
      dueDate: task.dueDate,
      status: task.status,
      priority: task.priority,
      description: task.description,
    });
    setIsTaskFormOpen(true);
  }

  function handleDeleteTask() {
    setIsDeleteTaskConfirmOpen(true);
  }

  function confirmDeleteTask() {
    if (!editingTaskId) return;
    const taskId = editingTaskId;
    closeTaskForm();
    setIsDeleteTaskConfirmOpen(false);
    setTasks((current) => current.filter((item) => item.id !== taskId));
    if (activeTaskId === taskId) {
      setActiveTaskId('');
    }
  }

  function handleCreateGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextGoal: GoalTarget = {
      id: makeId('goal'),
      customerId: detail.id,
      title: goalForm.title || '未命名目标',
      goalType: goalForm.goalType,
      owner: goalForm.owner || detail.followUpBy,
      startDate: TODAY,
      endDate: goalForm.endDate || TODAY,
      status: goalForm.status,
      targetAmount: goalForm.goalType === '金额目标' ? Number(goalForm.targetAmount || 0) : undefined,
      currentAmount: goalForm.goalType === '金额目标' ? Number(goalForm.currentAmount || 0) : undefined,
      summary: goalForm.summary || '新建目标待补充说明',
      linkedOrderIds: [],
    };

    setGoals((current) => [nextGoal, ...current]);
    setSelectedGoalId(nextGoal.id);
    closeGoalForm();
    emitEvent('on_create_goal', {
      customer_id: detail.id,
      goal_id: nextGoal.id,
      goal_type: nextGoal.goalType,
      title: nextGoal.title,
    });
  }

  function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGoal) {
      return;
    }

    if (editingTaskId) {
      setTasks((current) =>
        current.map((item) =>
          item.id === editingTaskId
            ? {
                ...item,
                title: taskForm.title || item.title,
                taskType: taskForm.taskType,
                assignee: taskForm.assignee || item.assignee,
                dueDate: taskForm.dueDate || item.dueDate,
                status: taskForm.status,
                priority: taskForm.priority,
                description: taskForm.description || item.description,
              }
            : item,
        ),
      );
      closeTaskForm();
      return;
    }

    const nextTask: TaskItem = {
      id: makeId('task'),
      goalId: selectedGoal.id,
      customerId: detail.id,
      title: taskForm.title || '未命名任务',
      taskType: taskForm.taskType,
      assignee: taskForm.assignee || detail.followUpBy,
      dueDate: taskForm.dueDate || TODAY,
      status: taskForm.status,
      priority: taskForm.priority,
      description: taskForm.description || '待补充任务说明',
      linkedOrderIds: [],
      latestProgressAt: '',
    };

    setTasks((current) => [nextTask, ...current]);
    setActiveTaskId(nextTask.id);
    closeTaskForm();
    emitEvent('on_create_task', {
      customer_id: detail.id,
      goal_id: selectedGoal.id,
      task_id: nextTask.id,
      task_type: nextTask.taskType,
      title: nextTask.title,
    });
  }

  function toggleAttachmentPreset(presetId: string) {
    setProgressForm((current) => ({
      ...current,
      attachmentPresetIds: current.attachmentPresetIds.includes(presetId)
        ? current.attachmentPresetIds.filter((item) => item !== presetId)
        : [...current.attachmentPresetIds, presetId],
    }));
  }

  function handleSubmitProgress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeTask) {
      return;
    }

    const attachmentItems = progressForm.attachmentPresetIds
      .map((presetId) => ATTACHMENT_PRESETS.find((item) => item.id === presetId))
      .filter((item): item is (typeof ATTACHMENT_PRESETS)[number] => Boolean(item))
      .map((preset) => ({
        id: makeId('attachment'),
        type: 'image' as const,
        name: preset.name,
        previewMode: preset.previewMode,
      }));

    const submittedAt = `${TODAY} ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`;
    const inferredProgressPercent =
      progressForm.status === '已完成'
        ? 100
        : activeTaskLogs[0]?.progressPercent || (activeTask.status === '已完成' ? 100 : 0);
    const nextLog: TaskProgressLog = {
      id: makeId('log'),
      taskId: activeTask.id,
      customerId: detail.id,
      submittedBy: progressForm.submittedBy || operatorName,
      submittedAt,
      progressPercent: inferredProgressPercent,
      content: progressForm.content || '已提交新进度',
      status: progressForm.status,
      attachments: attachmentItems,
    };

    setProgressLogs((current) => [nextLog, ...current]);
    setTasks((current) =>
      current.map((item) =>
        item.id === activeTask.id
          ? {
              ...item,
              status: progressForm.status === '未开始' ? '进行中' : progressForm.status,
              latestProgressAt: submittedAt,
            }
          : item,
      ),
    );
    setDetail((current) => ({
      ...current,
      lastFollowAt: submittedAt,
    }));
    closeProgressModal();
    emitEvent('on_submit_task_progress', {
      customer_id: detail.id,
      task_id: activeTask.id,
      goal_id: activeTask.goalId,
      submitted_at: submittedAt,
      progress_percent: inferredProgressPercent,
    });
  }

  function toggleTaskOrderBinding(orderId: string) {
    if (!activeTask) {
      return;
    }

    const isLinked = activeTask.linkedOrderIds.includes(orderId);
    const nextOrderIds = isLinked
      ? activeTask.linkedOrderIds.filter((item) => item !== orderId)
      : [...activeTask.linkedOrderIds, orderId];

    setTasks((current) =>
      current.map((item) =>
        item.id === activeTask.id
          ? {
              ...item,
              linkedOrderIds: uniqueIds(nextOrderIds),
            }
          : item,
      ),
    );

    emitEvent('on_link_task_orders', {
      customer_id: detail.id,
      goal_id: activeTask.goalId,
      task_id: activeTask.id,
      order_id: orderId,
      linked: !isLinked,
    });
  }

  useImperativeHandle(
    ref,
    () => ({
      getVar(name: string) {
        const vars: Record<string, unknown> = {
          current_customer_id: detail.id,
          selected_goal_id: selectedGoal?.id || '',
          selected_task_id: activeTask?.id || '',
          selected_order_id: selectedOrderId,
          open_task_count: openTaskCount,
          overdue_task_count: overdueTaskCount,
          shipping_address_count: shippingAddresses.length,
          tag_count: detail.tags.length,
          contact_count: contacts.length,
          presale_product_count: customerPresaleProducts.length,
        };
        return vars[name];
      },
      fireAction() {},
      eventList: EVENT_LIST,
      actionList: ACTION_LIST,
      varList: VAR_LIST,
      configList: CONFIG_LIST,
      dataList: DATA_LIST,
    }),
    [
      contacts.length,
      detail.id,
      detail.tags.length,
      openTaskCount,
      overdueTaskCount,
      activeTask?.id,
      selectedGoal?.id,
      selectedOrderId,
      shippingAddresses.length,
    ],
  );

  return (
    <div className="crm-customer-detail-shell">
      <div className="crm-customer-detail-logo">
        <div className="crm-customer-detail-logo-mark" aria-hidden="true">
          <span />
        </div>
        <span className="crm-customer-detail-logo-text">CLEARAL</span>
      </div>

      <header className="crm-customer-detail-topbar">
        <div className="crm-customer-detail-topbar-left">
          <button className="crm-customer-detail-icon-button" type="button" aria-label="打开菜单">
            <Menu size={16} />
          </button>
          <div className="crm-customer-detail-breadcrumb">
            <span>销售管理</span>
            <ChevronRight size={12} />
            <span>客户列表</span>
            <ChevronRight size={12} />
            <span className="active">客户360</span>
          </div>
        </div>

        <div className="crm-customer-detail-topbar-right">
          <span className="crm-customer-detail-operator">{operatorName}</span>
          <div className="crm-customer-detail-avatar" aria-hidden="true">
            <span>{operatorName.slice(0, 1)}</span>
          </div>
        </div>
      </header>

      <aside className="crm-customer-detail-sidebar">
        <nav className="crm-customer-detail-nav">
          {NAV_GROUPS.map((group) => (
            <div className="crm-customer-detail-nav-group" key={group.label}>
              <button className="crm-customer-detail-nav-parent" type="button">
                <span className="crm-customer-detail-nav-parent-label">
                  {group.icon}
                  <span>{group.label}</span>
                </span>
                {group.items ? <ChevronDown size={12} /> : null}
              </button>

              {group.items ? (
                <div className="crm-customer-detail-nav-children">
                  {group.items.map((item) => (
                    <button
                      className={`crm-customer-detail-nav-child${item.active ? ' is-active' : ''}`}
                      key={item.label}
                      type="button"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>
      </aside>

      <main className="crm-customer-detail-main">
        <section className="crm-customer-detail-tag-strip">
          <button className="crm-customer-detail-page-tag" type="button">
            仪表盘
            <span>×</span>
          </button>
          <button className="crm-customer-detail-page-tag" type="button">
            客户列表
            <span>×</span>
          </button>
          <button className="crm-customer-detail-page-tag is-active" type="button">
            客户360
            <span>×</span>
          </button>
        </section>

        <section className="crm-customer-detail-card">
          <aside className="crm-customer-detail-profile">
            <div className="crm-customer-detail-profile-header">
              <div className="crm-customer-detail-profile-avatar">{detail.displayName.slice(0, 1)}</div>
              <div className="crm-customer-detail-profile-title-wrap">
                <div style={{ minWidth: 0 }}>
                  <div className="crm-customer-detail-profile-title">{detail.displayName}</div>
                  <div className="crm-customer-detail-profile-subtitle">{detail.id}</div>
                </div>
                <button className="crm-customer-detail-link-button" type="button" aria-label="搜索客户">
                  <Search size={12} />
                </button>
              </div>
            </div>

            <div className="crm-customer-detail-profile-section">
              <div className="crm-customer-detail-profile-list">
                {coreFields.map(([label, value]) => (
                  <div className="crm-customer-detail-profile-row" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="crm-customer-detail-profile-summary">
              <button
                aria-label="查看关联订单"
                className="crm-customer-detail-profile-summary-card is-featured is-combined"
                type="button"
                onClick={openOrderOverviewModal}
              >
                {profileSummaryCards.map((item, index) => (
                  <div className="crm-customer-detail-profile-summary-stat" key={item.label}>
                    <strong style={index === 0 ? { whiteSpace: 'nowrap' } : undefined}>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </button>
            </div>

            <div className="crm-customer-detail-profile-section">
              <div
                className="crm-customer-detail-profile-section-header"
                onClick={() => setIsBasicInfoExpanded((v) => !v)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsBasicInfoExpanded((v) => !v); }}
              >
                <span>基础信息</span>
                {isBasicInfoExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
              <div className={`crm-customer-detail-profile-section-content${isBasicInfoExpanded ? '' : ' is-collapsed'}`}>
                <div className="crm-customer-detail-profile-list">
                  {basicFields.map(([label, value]) => (
                    <div className="crm-customer-detail-profile-row" key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="crm-customer-detail-profile-goals">
              <div className="crm-customer-detail-profile-section-head">
                <div className="crm-customer-detail-profile-tags-title">业绩目标</div>
                {sortedGoals.length > 0 ? (
                  <button className="crm-customer-detail-profile-goal-entry" type="button" onClick={openGoalListModal}>
                    查看全部
                    <ChevronRight size={14} />
                  </button>
                ) : null}
              </div>
              <div className="crm-customer-detail-profile-goal-list">
                {selectedGoal && selectedGoalTaskSummary ? (
                  <div className="crm-customer-detail-profile-goal-card is-selected is-static">
                    <div className="crm-customer-detail-profile-goal-top">
                      <strong>{selectedGoal.title}</strong>
                      <span className={`crm-customer-detail-status-badge ${getStatusClass(selectedGoal.status)}`}>
                        {selectedGoal.status}
                      </span>
                    </div>
                    <div className="crm-customer-detail-profile-goal-meta">
                      <span>{selectedGoalTaskSummary.headline}</span>
                      {selectedGoalTaskSummary.progressText ? (
                        <span>{selectedGoalTaskSummary.progressText}</span>
                      ) : (
                        <span>负责人：{selectedGoal.owner}</span>
                      )}
                    </div>
                    {selectedGoalTaskSummary.progressText ? (
                      <div
                        aria-label={`业绩达成进度 ${selectedGoalTaskSummary.percent}%`}
                        className="crm-customer-detail-profile-goal-progress"
                      >
                        <div className="crm-customer-detail-profile-goal-progress-head">
                          <span>业绩达成</span>
                          <strong>{selectedGoalTaskSummary.percent}%</strong>
                        </div>
                        <div className="crm-customer-detail-profile-goal-progress-track" aria-hidden="true">
                          <span style={{ width: `${selectedGoalTaskSummary.percent}%` }} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="crm-customer-detail-empty-state">
                    <div className="crm-customer-detail-empty-state-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
                    </div>
                    <strong>暂无业绩目标</strong>
                    <p>该客户尚未设定业绩目标，可点击下方按钮创建</p>
                  </div>
                )}
              </div>
            </div>

            <div className="crm-customer-detail-profile-tags">
              <div className="crm-customer-detail-profile-tags-title">标签</div>
              <button className="crm-customer-detail-tag-add-button" type="button" onClick={openTagForm}>
                <Plus size={12} />
                添加标签
              </button>
              <div className="crm-customer-detail-profile-tags-list">
                {detail.tags.map((tag) => (
                  <span className="crm-customer-detail-tag-chip" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="crm-customer-detail-profile-entry-panel">
              <button className="crm-customer-detail-profile-entry-button" type="button" onClick={openContactList}>
                <div>
                  <strong>联系人</strong>
                  <span>
                    已维护 {contacts.length} 位联系人
                    {contacts[0] ? `，主联系人 ${contacts[0].name}` : ''}
                  </span>
                </div>
                <ChevronRight size={14} />
              </button>
              <button className="crm-customer-detail-profile-entry-button" type="button" onClick={openShippingAddressList}>
                <div>
                  <strong>收货地址</strong>
                  <span>
                    已维护 {shippingAddresses.length} 条地址
                    {shippingAddresses[0] ? `，当前默认 ${shippingAddresses[0].region}` : ''}
                  </span>
                </div>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="crm-customer-detail-presale-entry">
              <button className="crm-customer-detail-presale-entry-button" type="button" onClick={openPresaleList}>
                <div>
                  <strong>预售打板</strong>
                  <span>
                    已关联 {customerPresaleProducts.length} 个预售产品
                    {customerPresaleProducts[0] ? `，最新 ${customerPresaleProducts[0].productName}` : ''}
                  </span>
                </div>
                <ChevronRight size={14} />
              </button>
            </div>
          </aside>

          <section className="crm-customer-detail-content">
            <div className="crm-customer-detail-workspace-head">
              <div className="crm-customer-detail-tab-group">
                <button
                  className={`crm-customer-detail-tab${activeTab === 'goal' ? ' is-active' : ''}`}
                  type="button"
                  onClick={() => setActiveTab('goal')}
                >
                  客户360执行视图
                </button>
                <button
                  className={`crm-customer-detail-tab${activeTab === 'warehouse' ? ' is-active' : ''}`}
                  type="button"
                  onClick={() => setActiveTab('warehouse')}
                >
                  独立仓
                </button>
                <button
                  className={`crm-customer-detail-tab${activeTab === 'productCompare' ? ' is-active' : ''}`}
                  type="button"
                  onClick={() => setActiveTab('productCompare')}
                >
                  产品信息对照表
                </button>
              </div>
            </div>

            <div className="crm-customer-detail-workspace">
              {activeTab === 'goal' ? (
                <React.Fragment>
                  <div className="crm-customer-detail-workspace-main">
                    <section className="crm-customer-detail-panel">
                      <div className="crm-customer-detail-goal-task-section is-standalone">
                        <div className="crm-customer-detail-task-section-header">
                          <h3 className="crm-customer-detail-task-section-title">任务列表</h3>
                          <button
                            className="crm-customer-detail-primary-button"
                            type="button"
                            onClick={() => setIsTaskFormOpen(true)}
                            disabled={!selectedGoal}
                          >
                            <Plus size={12} />
                            新建任务
                          </button>
                        </div>
                        <div className="crm-customer-detail-task-filter-toolbar">
                          <div className="crm-customer-detail-filter-group">
                            {taskFilterOptions.map((option) => (
                              <button
                                key={option.key}
                                className={`crm-customer-detail-filter-pill${taskListFilter === option.key ? ' is-active' : ''}`}
                                type="button"
                                onClick={() => setTaskListFilter(option.key)}
                              >
                                {option.label}（{option.count}）
                              </button>
                            ))}
                          </div>
                          <div className="crm-customer-detail-task-search-tools">
                            <label className="crm-customer-detail-task-search-field">
                              <Search size={14} />
                              <input
                                type="text"
                                value={taskNameKeyword}
                                onChange={(event) => setTaskNameKeyword(event.target.value)}
                                placeholder="搜索任务名称"
                              />
                            </label>
                            <div className="crm-customer-detail-task-date-filter">
                              <span>目标日期</span>
                              <DatePicker.RangePicker
                                allowClear
                                format="YYYY-MM-DD"
                                placeholder={['开始时间', '结束时间']}
                                value={[
                                  taskDueDateStart ? dayjs(taskDueDateStart) : null,
                                  taskDueDateEnd ? dayjs(taskDueDateEnd) : null,
                                ]}
                                onChange={(_dates, dateStrings) => {
                                  setTaskDueDateStart(dateStrings[0] || '');
                                  setTaskDueDateEnd(dateStrings[1] || '');
                                }}
                              />
                            </div>
                          </div>
                        </div>

                  {isTaskFormOpen ? (
                    <>
                      <div className="crm-customer-detail-drawer-mask" onClick={closeTaskForm} aria-hidden="true" />
                      <div
                        aria-labelledby="crm-customer-detail-task-modal-title"
                        aria-modal="true"
                        className="crm-customer-detail-modal"
                        role="dialog"
                      >
                        <div className="crm-customer-detail-modal-header">
                          <h3 id="crm-customer-detail-task-modal-title">{editingTaskId ? '编辑任务' : '新建任务'}</h3>
                          <button
                            aria-label={editingTaskId ? '关闭编辑任务弹窗' : '关闭新建任务弹窗'}
                            className="crm-customer-detail-icon-button"
                            type="button"
                            onClick={closeTaskForm}
                          >
                            <X size={16} />
                          </button>
                        </div>
                    <form className="crm-customer-detail-inline-form is-modal" onSubmit={handleCreateTask}>
                      <div className="crm-customer-detail-form-grid">
                        <label>
                          <span>任务名称</span>
                          <input
                            value={taskForm.title}
                            onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
                            placeholder="例如：跟进预售产品的打板进度"
                          />
                        </label>
                        <label>
                          <span>指定人</span>
                          <input
                            value={taskForm.assignee}
                            onChange={(event) => setTaskForm((current) => ({ ...current, assignee: event.target.value }))}
                          />
                        </label>
                        <label>
                          <span>目标日期</span>
                          <input
                            value={taskForm.dueDate}
                            onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))}
                          />
                        </label>
                        {!editingTaskId && (
                        <label>
                          <span>状态</span>
                          <select
                            value={taskForm.status}
                            onChange={(event) =>
                              setTaskForm((current) => ({ ...current, status: event.target.value as TaskStatus }))
                            }
                          >
                            <option value="未开始">未开始</option>
                            <option value="进行中">进行中</option>
                            <option value="有风险">有风险</option>
                            <option value="已完成">已完成</option>
                          </select>
                        </label>
                        )}
                        <label>
                          <span>优先级</span>
                          <select
                            value={taskForm.priority}
                            onChange={(event) =>
                              setTaskForm((current) => ({ ...current, priority: event.target.value as TaskPriority }))
                            }
                          >
                            <option value="高">高</option>
                            <option value="中">中</option>
                            <option value="低">低</option>
                          </select>
                        </label>
                        <label className="is-full">
                          <span>任务说明</span>
                          <textarea
                            value={taskForm.description}
                            onChange={(event) =>
                              setTaskForm((current) => ({ ...current, description: event.target.value }))
                            }
                            placeholder="说明任务目标、动作和交付物"
                          />
                        </label>
                      </div>
                      <div className="crm-customer-detail-form-actions">
                        {editingTaskId && (
                          <button
                            className="crm-customer-detail-danger-button"
                            type="button"
                            onClick={handleDeleteTask}
                          >
                            删除任务
                          </button>
                        )}
                        <button
                          className="crm-customer-detail-ghost-button"
                          type="button"
                          onClick={closeTaskForm}
                        >
                          取消
                        </button>
                        <button className="crm-customer-detail-primary-button" type="submit">
                          保存任务
                        </button>
                      </div>
                    </form>
                      </div>
                    </>
                  ) : null}

                  {isDeleteTaskConfirmOpen ? (
                    <>
                      <div
                        className="crm-customer-detail-confirm-mask"
                        onClick={() => setIsDeleteTaskConfirmOpen(false)}
                        aria-hidden="true"
                      />
                      <div
                        aria-modal="true"
                        className="crm-customer-detail-modal crm-customer-detail-confirm-modal"
                        role="dialog"
                      >
                        <div className="crm-customer-detail-modal-header">
                          <h3>确认删除任务</h3>
                          <button
                            aria-label="关闭确认弹窗"
                            className="crm-customer-detail-icon-button"
                            type="button"
                            onClick={() => setIsDeleteTaskConfirmOpen(false)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="crm-customer-detail-confirm-body">
                          <p>删除该任务后，其关联的 <strong>{getTaskLinkedOrderIds(tasks.find((t) => t.id === editingTaskId)!).length}</strong> 个订单和 <strong>{progressLogs.filter((log) => log.taskId === editingTaskId).length}</strong> 条跟进记录都会同步删除。</p>
                          <p>此操作不可撤销。确定要继续吗？</p>
                        </div>
                        <div className="crm-customer-detail-form-actions">
                          <button
                            className="crm-customer-detail-ghost-button"
                            type="button"
                            onClick={() => setIsDeleteTaskConfirmOpen(false)}
                          >
                            取消
                          </button>
                          <button
                            className="crm-customer-detail-danger-button"
                            type="button"
                            onClick={confirmDeleteTask}
                          >
                            确认删除
                          </button>
                        </div>
                      </div>
                    </>
                  ) : null}

                  <div className="crm-customer-detail-task-table">
                    <div className="crm-customer-detail-task-head">
                      <span>任务名称</span>
                      <span>状态</span>
                      <button
                        className="crm-customer-detail-task-sort-button"
                        type="button"
                        onClick={toggleTaskPrioritySortDirection}
                      >
                        <span>优先级</span>
                        {taskPrioritySortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                      </button>
                      <span>指定人</span>
                      <span>目标日期</span>
                      <span>订单金额</span>
                      <span>最近更新</span>
                      <span>操作</span>
                    </div>
                    {visibleGoalTasks.length > 0 ? (
                      visibleGoalTasks.map((task) => {
                        const latestLog = getTaskLatestLog(progressLogs, task.id);
                        const isOrderRelated = selectedOrderId ? task.linkedOrderIds.includes(selectedOrderId) : false;
                        return (
                          <div
                            className={`crm-customer-detail-task-row${activeTask?.id === task.id ? ' is-selected' : ''}${
                              isOrderRelated ? ' is-linked' : ''
                            }`}
                            key={task.id}
                            onClick={() => handleOpenTask(task.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleOpenTask(task.id);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="crm-customer-detail-task-title">
                              <strong>{task.title}</strong>
                              <small>{task.description}</small>
                            </div>
                            <span className={`crm-customer-detail-status-badge ${getStatusClass(task.status)}`}>
                              {task.status}
                            </span>
                            <span className={`crm-customer-detail-priority-badge ${getPriorityClass(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span>{task.assignee}</span>
                            <span>
                              {isTaskOverdue(task) && <span className="crm-customer-detail-overdue-label">逾期</span>}
                              {formatDueDate(task)}
                            </span>
                            <span>{formatCurrency(getTaskLinkedOrderAmount(task, customerOrders))}</span>
                            <span>{latestLog ? formatDate(latestLog.submittedAt) : '-'}</span>
                            <div className="crm-customer-detail-task-actions">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleEditTask(task);
                                }}
                              >
                                编辑
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleCreateProgressForTask(task.id);
                                }}
                              >
                                新增跟进
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="crm-customer-detail-empty-row">
                        {goalTasks.length > 0 ? '当前筛选下暂无任务。' : '当前目标下暂无任务，可直接新建任务。'}
                      </div>
                    )}
                  </div>
                  </div>
                </section>
              </div>

              <aside className="crm-customer-detail-workspace-side">
                <section className="crm-customer-detail-panel crm-customer-detail-timeline-panel">
                  <div className="crm-customer-detail-panel-header crm-customer-detail-timeline-header">
                    <div className="crm-customer-detail-timeline-header-top">
                      <strong className="crm-customer-detail-timeline-summary-title">
                        {activeTask?.title || '当前目标下暂无任务'}
                      </strong>
                      <div className="crm-customer-detail-panel-summary crm-customer-detail-panel-summary-inline">
                        <label className="crm-customer-detail-task-search-field">
                          <Search size={14} />
                          <input
                            type="text"
                            value={timelineKeyword}
                            onChange={(event) => setTimelineKeyword(event.target.value)}
                            placeholder="搜索时间线"
                          />
                        </label>
                        <button
                          className={`crm-customer-detail-timeline-filter-chip${timelineFilter === 'progress' ? ' is-active' : ''}`}
                          type="button"
                          onClick={() => setTimelineFilter((prev) => (prev === 'progress' ? 'all' : 'progress'))}
                        >
                          跟进次数 {activeTaskLogs.length}
                        </button>
                        <button
                          className={`crm-customer-detail-timeline-filter-chip${timelineFilter === 'order' ? ' is-active' : ''}`}
                          type="button"
                          onClick={() => setTimelineFilter((prev) => (prev === 'order' ? 'all' : 'order'))}
                        >
                          下单笔数 {activeTaskOrders.length}
                        </button>
                      </div>
                    </div>
                    <div className="crm-customer-detail-timeline-summary-meta">
                      <span>订单金额：{formatCurrency(activeTaskOrderAmount)}</span>
                      <span>主要购买：{activeTaskPurchaseSummary}</span>
                    </div>
                  </div>
                  <div className="crm-customer-detail-timeline-layout">
                    <div className="crm-customer-detail-timeline">
                      {filteredTimelineEntries.length > 0 ? (
                        filteredTimelineEntries.map((entry) => (
                          <article
                            className={`crm-customer-detail-timeline-item is-${entry.type}${selectedTimelineEntryId === entry.id ? ' is-selected' : ''}`}
                            key={entry.id}
                          >
                            <div className={`crm-customer-detail-timeline-dot is-${entry.type}`} />
                            <div className="crm-customer-detail-timeline-content">
                              {entry.type === 'progress' ? (
                                <>
                                  <div className="crm-customer-detail-timeline-head">
                                    <div className="crm-customer-detail-timeline-meta crm-customer-detail-timeline-meta-group">
                                      <span>{entry.submittedBy}</span>
                                      <span className={`crm-customer-detail-status-badge ${getStatusClass(entry.status)}`}>
                                        {entry.status}
                                      </span>
                                    </div>
                                    <span className="crm-customer-detail-timeline-time">
                                      {formatRelativeTime(entry.happenedAt)}
                                    </span>
                                  </div>
                                  <p>{entry.content}</p>
                                  {entry.attachments.length > 0 ? (
                                    <div className="crm-customer-detail-attachment-list">
                                      {entry.attachments.map((attachment) => (
                                        <div
                                          className={`crm-customer-detail-attachment-card is-${attachment.previewMode}`}
                                          key={attachment.id}
                                        >
                                          <span>IMG</span>
                                          <strong>{attachment.name}</strong>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}
                                </>
                              ) : (
                                <>
                                  <div className="crm-customer-detail-timeline-head">
                                    <div className="crm-customer-detail-timeline-meta crm-customer-detail-timeline-meta-group">
                                      <span>创建人：{entry.createdBy}</span>
                                      <span>金额：{formatCurrency(entry.orderAmount)}</span>
                                      <span>{entry.orderStatus}</span>
                                    </div>
                                    <span className="crm-customer-detail-timeline-time">
                                      {formatRelativeTime(entry.happenedAt)}
                                    </span>
                                  </div>
                                  <p>{entry.content}</p>
                                  <div className="crm-customer-detail-timeline-order-meta">
                                    <span>订单号：{entry.order.id}</span>
                                    <span>收货人：{entry.order.consignee}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="crm-customer-detail-empty-card">
                          {activeTask ? '当前任务暂无进度和订单动态。' : '请先在当前目标下选择任务。'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="crm-customer-detail-timeline-footer">
                    <button
                      className="crm-customer-detail-primary-button"
                      type="button"
                      onClick={openProgressModal}
                      disabled={!activeTask}
                    >
                      新增跟进
                    </button>
                  </div>
                </section>
              </aside>
                </React.Fragment>
              ) : null}
            </div>

            {activeTab === 'goal' && (
            <section className="crm-customer-detail-analysis-grid">
              <article className="crm-customer-detail-panel crm-customer-detail-analysis-panel is-primary">
                <div className="crm-customer-detail-chart-header crm-customer-detail-chart-header-extended">
                  <div>
                    <div className="crm-customer-detail-section-title">
                      <span className="crm-customer-detail-section-bar" />
                      <span>跟进-成交联动趋势</span>
                    </div>
                  </div>
                  <div className="crm-customer-detail-date-range">
                    <span>{analysisDateRange}</span>
                  </div>
                </div>
                {analysisHasData ? (
                  <>
                    <div className="crm-customer-detail-chart-legend">
                      <span className="is-order-completed">已完成订单</span>
                      <span className="is-order-pending">未完成订单</span>
                      <span className="is-follow-up">跟进次数</span>
                    </div>
                    <div className="crm-customer-detail-chart-stage">
                      <div className="crm-customer-detail-chart-stage-inner">
                        {activeAnalysisPoint ? (
                          <div
                            className={`crm-customer-detail-analysis-tooltip ${analysisTooltipAlignClass}`}
                            style={{ left: analysisTooltipLeft }}
                          >
                            <span className="crm-customer-detail-analysis-tooltip-month">{activeAnalysisPoint.monthKey}</span>
                            <strong>{formatCurrency(activeAnalysisPoint.orderAmount)}</strong>
                            <div className="crm-customer-detail-analysis-tooltip-meta">
                              <span>{activeAnalysisPoint.orderCount} 笔订单</span>
                              <span>已完成 {activeAnalysisPoint.completedOrderCount} 笔</span>
                              <span>未完成 {activeAnalysisPoint.pendingOrderCount} 笔</span>
                              <span>{activeAnalysisPoint.followUpCount} 次跟进</span>
                            </div>
                            <small>{activeAnalysisPoint.productSummary}</small>
                          </div>
                        ) : null}
                        <svg className="crm-customer-detail-combo-chart" viewBox="0 0 720 280" aria-hidden="true">
                          <defs>
                            <linearGradient id="crm-customer-detail-order-completed-gradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#86efac" />
                              <stop offset="100%" stopColor="#22c55e" />
                            </linearGradient>
                            <linearGradient id="crm-customer-detail-order-pending-gradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#fdba74" />
                              <stop offset="100%" stopColor="#f97316" />
                            </linearGradient>
                            <linearGradient id="crm-customer-detail-follow-gradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgba(59,130,246,0.22)" />
                              <stop offset="100%" stopColor="rgba(59,130,246,0.02)" />
                            </linearGradient>
                          </defs>
                          {comboChartOrderTicks.map((tick, index) => (
                            <g key={tick.key}>
                              <line
                                x1={comboChartLeft}
                                y1={tick.y}
                                x2={comboChartLeft + comboChartWidth}
                                y2={tick.y}
                                className={index === comboChartOrderTicks.length - 1 ? 'grid-line is-strong' : 'grid-line'}
                              />
                              <text x={12} y={tick.y + 4} className="axis-text">
                                {tick.label}
                              </text>
                            </g>
                          ))}
                          {comboChartFollowTicks.map((tick) => (
                            <text key={tick.key} x={708} y={tick.y + 4} className="axis-text is-end">
                              {tick.label}
                            </text>
                          ))}
                          {activeAnalysisPoint && activeAnalysisBar ? (
                            <>
                              <rect
                                x={activeAnalysisBar.centerX - comboChartStep / 2 + 4}
                                y={comboChartTop}
                                width={Math.max(comboChartStep - 8, 16)}
                                height={comboChartHeight}
                                rx="14"
                                className="crm-customer-detail-chart-highlight"
                              />
                              <line
                                x1={activeAnalysisBar.centerX}
                                y1={comboChartTop}
                                x2={activeAnalysisBar.centerX}
                                y2={comboChartBaseY}
                                className="crm-customer-detail-chart-crosshair"
                              />
                            </>
                          ) : null}
                          {comboChartAreaPath ? <path d={comboChartAreaPath} className="crm-customer-detail-line-area" /> : null}
                          {comboChartBars.map((point, index) => (
                            <g key={point.monthKey}>
                              {point.barHeight > 0 ? (
                                <>
                                  <defs>
                                    <clipPath id={point.clipPathId}>
                                      <rect x={point.x} y={point.y} width={point.barWidth} height={point.barHeight} rx="6" />
                                    </clipPath>
                                  </defs>
                                  {point.pendingBarHeight > 0 ? (
                                    <rect
                                      x={point.x}
                                      y={point.pendingY}
                                      width={point.barWidth}
                                      height={point.pendingBarHeight}
                                      clipPath={`url(#${point.clipPathId})`}
                                      className={`crm-customer-detail-combo-bar is-pending${index === activeAnalysisIndex ? ' is-active' : ''}`}
                                    />
                                  ) : null}
                                  {point.completedBarHeight > 0 ? (
                                    <rect
                                      x={point.x}
                                      y={point.completedY}
                                      width={point.barWidth}
                                      height={point.completedBarHeight}
                                      clipPath={`url(#${point.clipPathId})`}
                                      className={`crm-customer-detail-combo-bar is-completed${index === activeAnalysisIndex ? ' is-active' : ''}`}
                                    />
                                  ) : null}
                                  {point.pendingBarHeight > 0 && point.completedBarHeight > 0 ? (
                                    <line
                                      x1={point.x + 3}
                                      y1={point.completedY}
                                      x2={point.x + point.barWidth - 3}
                                      y2={point.completedY}
                                      className="crm-customer-detail-combo-bar-divider"
                                    />
                                  ) : null}
                                </>
                              ) : null}
                              <text x={point.centerX} y="258" className="axis-text is-center">
                                {point.label}
                              </text>
                            </g>
                          ))}
                          <path d={comboChartLinePath} className="line-path" />
                          {comboChartLineDots.map((point, index) => (
                            <g key={`${point.monthKey}-dot`}>
                              <circle
                                cx={point.x}
                                cy={point.y}
                                r={index === activeAnalysisIndex ? 7 : 5}
                                className={`crm-customer-detail-line-dot${index === activeAnalysisIndex ? ' is-active' : ''}`}
                              />
                              <circle
                                cx={point.x}
                                cy={point.y}
                                r={index === activeAnalysisIndex ? 3 : 2}
                                className="crm-customer-detail-line-dot-core"
                              />
                            </g>
                          ))}
                        </svg>
                        <div
                          className="crm-customer-detail-chart-hover-grid"
                          style={{ gridTemplateColumns: `repeat(${analysisPoints.length}, minmax(0, 1fr))` }}
                        >
                          {analysisPoints.map((point, index) => (
                            <button
                              key={`${point.monthKey}-hover`}
                              aria-label={`${point.label}数据详情`}
                              className="crm-customer-detail-chart-hover-zone"
                              type="button"
                              onMouseEnter={() => setHoveredAnalysisIndex(index)}
                              onFocus={() => setHoveredAnalysisIndex(index)}
                              onMouseLeave={() => setHoveredAnalysisIndex(null)}
                              onBlur={() => setHoveredAnalysisIndex(null)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="crm-customer-detail-empty-card">近 6 个月暂无跟进或下单数据。</div>
                )}
              </article>

              <div className="crm-customer-detail-analysis-side">
                <article className="crm-customer-detail-panel">
                  <div className="crm-customer-detail-chart-header">
                    <div>
                      <div className="crm-customer-detail-section-title">
                        <span className="crm-customer-detail-section-bar" />
                        <span>客户购买结构分析</span>
                      </div>
                    </div>
                    <div className="crm-customer-detail-tab-group crm-customer-detail-analysis-tab-group">
                      {PURCHASE_STRUCTURE_DIMENSIONS.map((dimension) => (
                        <button
                          key={dimension.key}
                          className={`crm-customer-detail-tab${activePurchaseDimension === dimension.key ? ' is-active' : ''}`}
                          type="button"
                          onClick={() => setActivePurchaseDimension(dimension.key)}
                        >
                          {dimension.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {purchaseStructureItems.length > 0 ? (
                    <>
                      <div className="crm-customer-detail-purchase-rank-list">
                        {purchaseStructureItems.map((item, index) => (
                          <div className="crm-customer-detail-purchase-rank-row" key={item.key}>
                            <div className="crm-customer-detail-purchase-rank-main">
                              <div className="crm-customer-detail-purchase-rank-title">
                                <span className="crm-customer-detail-purchase-rank-index">
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                                <div>
                                  <strong>{item.label}</strong>
                                  <p>
                                    {item.productCount} 款商品 · {item.orderCount} 单 · 占比 {Math.round(item.share * 100)}%
                                  </p>
                                </div>
                              </div>
                              <div className="crm-customer-detail-purchase-rank-track" aria-hidden="true">
                                <span style={{ width: `${Math.max(item.share * 100, 10)}%` }} />
                              </div>
                            </div>
                            <span className="crm-customer-detail-purchase-rank-value">{item.quantity} 件</span>
                            <span className="crm-customer-detail-purchase-rank-value is-amount">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="crm-customer-detail-empty-card">当前客户暂无可用于购买结构分析的商品规格数据。</div>
                  )}
                </article>
              </div>
            </section>
            )}
        </section>
      </section>
      </main>

      {isGoalFormOpen ? (
        <>
          <div className="crm-customer-detail-drawer-mask" onClick={closeGoalForm} aria-hidden="true" />
          <div
            aria-labelledby="crm-customer-detail-goal-modal-title"
            aria-modal="true"
            className="crm-customer-detail-modal"
            role="dialog"
          >
            <div className="crm-customer-detail-modal-header">
              <h3 id="crm-customer-detail-goal-modal-title">创建客户目标</h3>
              <button
                aria-label="关闭新建目标弹窗"
                className="crm-customer-detail-icon-button"
                type="button"
                onClick={closeGoalForm}
              >
                <X size={16} />
              </button>
            </div>
            <form className="crm-customer-detail-inline-form is-modal" onSubmit={handleCreateGoal}>
              <div className="crm-customer-detail-form-grid is-goal">
                <label>
                  <span>目标名称</span>
                  <input
                    value={goalForm.title}
                    onChange={(event) => setGoalForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="例如：5月新品首发目标"
                  />
                </label>
                <label>
                  <span>目标金额</span>
                  <input
                    value={goalForm.targetAmount}
                    onChange={(event) => setGoalForm((current) => ({ ...current, targetAmount: event.target.value }))}
                  />
                </label>
                <label className="is-full">
                  <span>目标说明</span>
                  <textarea
                    value={goalForm.summary}
                    onChange={(event) => setGoalForm((current) => ({ ...current, summary: event.target.value }))}
                    placeholder="补充目标背景、推进重点和协同要求"
                  />
                </label>
              </div>
              <div className="crm-customer-detail-form-actions">
                <button className="crm-customer-detail-ghost-button" type="button" onClick={closeGoalForm}>
                  取消
                </button>
                <button className="crm-customer-detail-primary-button" type="submit">
                  保存目标
                </button>
              </div>
            </form>
          </div>
        </>
      ) : null}

      {isGoalListModalOpen ? (
        <>
          <div className="crm-customer-detail-overlay-mask" onClick={closeGoalListModal} aria-hidden="true" />
          <div
            aria-labelledby="crm-customer-detail-goal-list-title"
            aria-modal="true"
            className="crm-customer-detail-modal crm-customer-detail-overlay-modal crm-customer-detail-goal-list-modal"
            role="dialog"
          >
            <div className="crm-customer-detail-modal-header">
              <div>
                <h3 id="crm-customer-detail-goal-list-title">全部业绩目标</h3>
                <p className="crm-customer-detail-drawer-copy">查看并切换当前客户的全部业绩目标。</p>
              </div>
              <div className="crm-customer-detail-goal-modal-actions">
                <button
                  className="crm-customer-detail-primary-button"
                  type="button"
                  onClick={() => {
                    closeGoalListModal();
                    setIsGoalFormOpen(true);
                  }}
                >
                  <Plus size={12} />
                  新建目标
                </button>
                <button
                  aria-label="关闭业绩目标列表"
                  className="crm-customer-detail-icon-button"
                  type="button"
                  onClick={closeGoalListModal}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="crm-customer-detail-inline-form is-modal">
              <div className="crm-customer-detail-profile-goal-list is-modal">
                {sortedGoals.length > 0 ? (
                  sortedGoals.map((goal) => {
                    const goalSummary = getGoalTaskSummary(goal, tasks);
                    const goalLinkedOrderCount = getGoalLinkedOrderCount(goal, tasks);
                    return (
                      <button
                        className={`crm-customer-detail-profile-goal-card${selectedGoal?.id === goal.id ? ' is-selected' : ''}`}
                        key={goal.id}
                        type="button"
                        onClick={() => {
                          handleSelectGoal(goal.id);
                          closeGoalListModal();
                        }}
                      >
                        <div className="crm-customer-detail-profile-goal-top">
                          <strong>{goal.title}</strong>
                          <span className={`crm-customer-detail-status-badge ${getStatusClass(goal.status)}`}>{goal.status}</span>
                        </div>
                        <p>{goal.summary}</p>
                        <div className="crm-customer-detail-profile-goal-meta">
                          <span>{goalSummary.headline}</span>
                          {goalSummary.progressText ? <span>{goalSummary.progressText}</span> : <span>负责人：{goal.owner}</span>}
                          <span>关联订单：{goalLinkedOrderCount}</span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="crm-customer-detail-empty-card">当前客户暂无目标。</div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {isOrderOverviewModalOpen ? (
        <>
          <div className="crm-customer-detail-overlay-mask" onClick={closeOrderOverviewModal} aria-hidden="true" />
          <div
            aria-labelledby="crm-customer-detail-order-overview-modal-title"
            aria-modal="true"
            className="crm-customer-detail-modal crm-customer-detail-overlay-modal crm-customer-detail-order-overview-modal"
            role="dialog"
          >
            <div className="crm-customer-detail-modal-header">
              <div>
                <h3 id="crm-customer-detail-order-overview-modal-title">订单联动</h3>
                              </div>
              <button
                aria-label="关闭订单联动弹窗"
                className="crm-customer-detail-icon-button"
                type="button"
                onClick={closeOrderOverviewModal}
              >
                <X size={16} />
              </button>
            </div>
            <div className="crm-customer-detail-inline-form is-modal">
              <div className="crm-customer-detail-order-table">
                <div className="crm-customer-detail-order-head">
                  <span>订单号</span>
                  <span>状态</span>
                  <span>金额</span>
                  <span>时间</span>
                  <span>创建人</span>
                  <span>收货人</span>
                  <span>关联任务</span>
                  <span>操作</span>
                </div>
                {orderedCustomerOrders.length > 0 ? (
                  orderedCustomerOrders.map((order) => {
                    const relatedTasks = goalTasks.filter((task) => task.linkedOrderIds.includes(order.id));
                    const isLinkedToGoal = selectedGoalLinkedOrderIds.includes(order.id);
                    return (
                      <div
                        className={`crm-customer-detail-order-row${selectedOrderId === order.id ? ' is-selected' : ''}${
                          isLinkedToGoal ? ' is-linked' : ''
                        }`}
                        key={order.id}
                      >
                        <strong>{order.id}</strong>
                        <span className="crm-customer-detail-order-status">{order.orderStatus}</span>
                        <span>{formatCurrency(order.orderAmount)}</span>
                        <span>{order.orderTime}</span>
                        <span>{getOrderCreatedBy(order, selectedGoal?.owner || detail.followUpBy)}</span>
                        <span>{order.consignee}</span>
                        <span>{relatedTasks.length}</span>
                        <div className="crm-customer-detail-order-actions">
                          <button type="button">详情</button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="crm-customer-detail-empty-state">暂无订单</div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {isTagFormOpen ? (
        <>
          <div className="crm-customer-detail-overlay-mask" onClick={closeTagForm} aria-hidden="true" />
          <div
            aria-labelledby="crm-customer-detail-tag-form-title"
            aria-modal="true"
            className="crm-customer-detail-modal crm-customer-detail-overlay-modal crm-customer-detail-tag-form-modal"
            role="dialog"
          >
            <div className="crm-customer-detail-modal-header">
              <div>
                <h3 id="crm-customer-detail-tag-form-title">添加客户标签</h3>
                <p className="crm-customer-detail-drawer-copy">维护当前客户的经营标签，保存后立即展示在左侧档案卡。</p>
              </div>
              <button
                aria-label="关闭添加标签弹窗"
                className="crm-customer-detail-icon-button"
                type="button"
                onClick={closeTagForm}
              >
                <X size={16} />
              </button>
            </div>
            <form className="crm-customer-detail-inline-form is-modal" onSubmit={handleCreateTag}>
              <div className="crm-customer-detail-form-grid is-tag">
                <label>
                  <span>标签名称</span>
                  <input
                    autoFocus
                    maxLength={12}
                    value={tagForm.name}
                    onChange={(event) => setTagForm({ name: event.target.value })}
                    placeholder="例如：新品敏感"
                  />
                  <small>{tagForm.name.length} / 12</small>
                </label>
              </div>
              <div className="crm-customer-detail-form-actions">
                <button className="crm-customer-detail-ghost-button" type="button" onClick={closeTagForm}>
                  取消
                </button>
                <button className="crm-customer-detail-primary-button" type="submit" disabled={!tagForm.name.trim()}>
                  保存标签
                </button>
              </div>
            </form>
          </div>
        </>
      ) : null}

      {isShippingAddressListOpen ? (
        <>
          <div className="crm-customer-detail-overlay-mask" onClick={closeShippingAddressList} aria-hidden="true" />
          <div
            aria-labelledby="crm-customer-detail-shipping-address-list-title"
            aria-modal="true"
            className="crm-customer-detail-modal crm-customer-detail-overlay-modal crm-customer-detail-address-modal"
            role="dialog"
          >
            <div className="crm-customer-detail-modal-header">
              <div>
                <h3 id="crm-customer-detail-shipping-address-list-title">收货地址</h3>
                <p className="crm-customer-detail-drawer-copy">查看并维护当前客户常用收货信息。</p>
              </div>
              <div className="crm-customer-detail-address-toolbar">
                <button
                  className="crm-customer-detail-primary-button"
                  type="button"
                  onClick={() => openShippingAddressForm()}
                >
                  新增
                </button>
                <button
                  aria-label="关闭收货地址列表"
                  className="crm-customer-detail-icon-button"
                  type="button"
                  onClick={closeShippingAddressList}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="crm-customer-detail-address-table">
              <div className="crm-customer-detail-address-head">
                <span>收货人</span>
                <span>联系方式</span>
                <span>收货地址</span>
                <span>操作</span>
              </div>
              {shippingAddresses.length > 0 ? (
                shippingAddresses.map((address) => (
                  <div className="crm-customer-detail-address-row" key={address.id}>
                    <strong>{maskSensitiveText(address.receiver)}</strong>
                    <span>{maskSensitiveText(address.mobile, 3, 4)}</span>
                    <span>{`${address.region}${address.detailAddress ? ` ${address.detailAddress}` : ''}`}</span>
                    <div className="crm-customer-detail-address-actions">
                      <button type="button" onClick={() => openShippingAddressForm(address)}>
                        详情
                      </button>
                      <button type="button" onClick={() => openShippingAddressForm(address)}>
                        编辑
                      </button>
                      <button className="is-danger" type="button" onClick={() => handleDeleteShippingAddress(address.id)}>
                        删除
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="crm-customer-detail-empty-state">暂无收货地址，点击右上角新增维护。</div>
              )}
            </div>
          </div>
        </>
      ) : null}

      {isContactListOpen ? (
        <>
          <div className="crm-customer-detail-overlay-mask" onClick={closeContactList} aria-hidden="true" />
          <div
            aria-labelledby="crm-customer-detail-contact-list-title"
            aria-modal="true"
            className="crm-customer-detail-modal crm-customer-detail-overlay-modal crm-customer-detail-contact-modal"
            role="dialog"
          >
            <div className="crm-customer-detail-modal-header">
              <div>
                <h3 id="crm-customer-detail-contact-list-title">联系人</h3>
                <p className="crm-customer-detail-drawer-copy">查看并维护当前客户联系人信息。</p>
              </div>
              <div className="crm-customer-detail-address-toolbar">
                <button className="crm-customer-detail-primary-button" type="button" onClick={() => openContactForm()}>
                  新增
                </button>
                <button
                  aria-label="关闭联系人列表"
                  className="crm-customer-detail-icon-button"
                  type="button"
                  onClick={closeContactList}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="crm-customer-detail-address-table">
              <div className="crm-customer-detail-contact-head">
                <span>联系人</span>
                <span>邮箱</span>
                <span>职位</span>
                <span>操作</span>
              </div>
              {contacts.length > 0 ? (
                contacts.map((contact) => (
                  <div className="crm-customer-detail-contact-row" key={contact.id}>
                    <strong>{maskSensitiveText(contact.name)}</strong>
                    <span>{contact.email || '-'}</span>
                    <span>{contact.position || '-'}</span>
                    <div className="crm-customer-detail-address-actions">
                      <button type="button" onClick={() => openContactForm(contact)}>
                        详情
                      </button>
                      <button type="button" onClick={() => openContactForm(contact)}>
                        编辑
                      </button>
                      <button className="is-danger" type="button" onClick={() => handleDeleteContact(contact.id)}>
                        删除
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="crm-customer-detail-empty-state">暂无联系人，点击右上角新增维护。</div>
              )}
            </div>
          </div>
        </>
      ) : null}

      {isContactFormOpen ? (
        <>
          <div className="crm-customer-detail-overlay-mask is-raised" onClick={closeContactForm} aria-hidden="true" />
          <div
            aria-labelledby="crm-customer-detail-contact-form-title"
            aria-modal="true"
            className="crm-customer-detail-modal crm-customer-detail-overlay-modal crm-customer-detail-contact-form-modal"
            role="dialog"
          >
            <div className="crm-customer-detail-modal-header">
              <h3 id="crm-customer-detail-contact-form-title">{activeContact ? '编辑联系人' : '新增联系人'}</h3>
              <button
                aria-label="关闭联系人弹窗"
                className="crm-customer-detail-icon-button"
                type="button"
                onClick={closeContactForm}
              >
                <X size={16} />
              </button>
            </div>
            <form className="crm-customer-detail-inline-form is-modal" onSubmit={handleSaveContact}>
              <div className="crm-customer-detail-form-grid is-contact">
                <label>
                  <span>* 联系人</span>
                  <input
                    maxLength={10}
                    value={contactForm.name}
                    onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="请输入"
                  />
                  <small>{contactForm.name.length} / 10</small>
                </label>
                <label>
                  <span>邮箱</span>
                  <input
                    maxLength={50}
                    value={contactForm.email}
                    onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="请输入"
                  />
                  <small>{contactForm.email.length} / 50</small>
                </label>
                <label className="is-composite">
                  <span>社交平台</span>
                  <select
                    value={contactForm.socialPlatform}
                    onChange={(event) =>
                      setContactForm((current) => ({ ...current, socialPlatform: event.target.value }))
                    }
                  >
                    <option value="">请选择</option>
                    <option value="微信">微信</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Line">Line</option>
                    <option value="Facebook">Facebook</option>
                  </select>
                  <input
                    value={contactForm.socialAccount}
                    onChange={(event) =>
                      setContactForm((current) => ({ ...current, socialAccount: event.target.value }))
                    }
                    placeholder="请输入"
                  />
                  <button aria-label="增加社交平台" type="button">
                    +
                  </button>
                </label>
                <label className="is-composite is-phone">
                  <span>联系电话</span>
                  <input
                    value={contactForm.phonePrefix}
                    onChange={(event) => setContactForm((current) => ({ ...current, phonePrefix: event.target.value }))}
                    placeholder="+86"
                  />
                  <input
                    maxLength={20}
                    value={contactForm.phone}
                    onChange={(event) => setContactForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="请输入"
                  />
                  <small>{contactForm.phone.length} / 20</small>
                  <button aria-label="增加联系电话" type="button">
                    +
                  </button>
                </label>
                <label>
                  <span>职位</span>
                  <input
                    maxLength={20}
                    value={contactForm.position}
                    onChange={(event) => setContactForm((current) => ({ ...current, position: event.target.value }))}
                    placeholder="请输入"
                  />
                  <small>{contactForm.position.length} / 20</small>
                </label>
                <label>
                  <span>生日</span>
                  <input
                    type="date"
                    value={contactForm.birthday}
                    onChange={(event) => setContactForm((current) => ({ ...current, birthday: event.target.value }))}
                  />
                </label>
                <label>
                  <span>性别</span>
                  <select
                    value={contactForm.gender}
                    onChange={(event) => setContactForm((current) => ({ ...current, gender: event.target.value }))}
                  >
                    <option value="">请选择</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="未知">未知</option>
                  </select>
                </label>
                <label className="is-upload">
                  <span>名片/头像</span>
                  <button type="button" onClick={() => setContactForm((current) => ({ ...current, cardName: '联系人名片.png' }))}>
                    点击上传
                  </button>
                  <small>{contactForm.cardName || '只能上传jpg/png文件'}</small>
                </label>
                <label className="is-remark">
                  <span>备注</span>
                  <textarea
                    maxLength={100}
                    value={contactForm.remark}
                    onChange={(event) => setContactForm((current) => ({ ...current, remark: event.target.value }))}
                    placeholder="请输入"
                  />
                  <small>{contactForm.remark.length} / 100</small>
                </label>
              </div>
              <div className="crm-customer-detail-form-actions">
                <button className="crm-customer-detail-ghost-button" type="button" onClick={closeContactForm}>
                  取消
                </button>
                <button className="crm-customer-detail-primary-button" type="submit">
                  确定
                </button>
              </div>
            </form>
          </div>
        </>
      ) : null}

      {isShippingAddressFormOpen ? (
        <>
          <div className="crm-customer-detail-overlay-mask is-raised" onClick={closeShippingAddressForm} aria-hidden="true" />
          <div
            aria-labelledby="crm-customer-detail-shipping-address-form-title"
            aria-modal="true"
            className="crm-customer-detail-modal crm-customer-detail-overlay-modal crm-customer-detail-address-form-modal"
            role="dialog"
          >
            <div className="crm-customer-detail-modal-header">
              <h3 id="crm-customer-detail-shipping-address-form-title">
                {activeShippingAddress ? '编辑收货地址' : '新增收货地址'}
              </h3>
              <button
                aria-label="关闭收货地址弹窗"
                className="crm-customer-detail-icon-button"
                type="button"
                onClick={closeShippingAddressForm}
              >
                <X size={16} />
              </button>
            </div>
            <form className="crm-customer-detail-inline-form is-modal" onSubmit={handleSaveShippingAddress}>
              <div className="crm-customer-detail-form-grid is-address">
                <label>
                  <span>* 收货人</span>
                  <input
                    maxLength={50}
                    value={shippingAddressForm.receiver}
                    onChange={(event) =>
                      setShippingAddressForm((current) => ({ ...current, receiver: event.target.value }))
                    }
                    placeholder="请输入"
                  />
                  <small>{shippingAddressForm.receiver.length} / 50</small>
                </label>
                <label>
                  <span>* 收货人联系方式</span>
                  <input
                    maxLength={20}
                    value={shippingAddressForm.mobile}
                    onChange={(event) =>
                      setShippingAddressForm((current) => ({ ...current, mobile: event.target.value }))
                    }
                    placeholder="请输入"
                  />
                  <small>{shippingAddressForm.mobile.length} / 20</small>
                </label>
                <label>
                  <span>* 国家地区</span>
                  <select
                    value={shippingAddressForm.region}
                    onChange={(event) =>
                      setShippingAddressForm((current) => ({ ...current, region: event.target.value }))
                    }
                  >
                    <option value="">请选择国家地区</option>
                    <option value="百慕大">百慕大</option>
                    <option value="阿尔巴尼亚">阿尔巴尼亚</option>
                    <option value="奥兰群岛">奥兰群岛</option>
                    <option value="中国">中国</option>
                    <option value="美国">美国</option>
                  </select>
                </label>
                <label>
                  <span>* 详细地址</span>
                  <input
                    maxLength={200}
                    value={shippingAddressForm.detailAddress}
                    onChange={(event) =>
                      setShippingAddressForm((current) => ({ ...current, detailAddress: event.target.value }))
                    }
                    placeholder="请输入详细地址"
                  />
                  <small>{shippingAddressForm.detailAddress.length} / 200</small>
                </label>
              </div>
              <div className="crm-customer-detail-form-actions">
                <button className="crm-customer-detail-ghost-button" type="button" onClick={closeShippingAddressForm}>
                  取消
                </button>
                <button className="crm-customer-detail-primary-button" type="submit">
                  确定
                </button>
              </div>
            </form>
          </div>
        </>
      ) : null}

      {activeTask && isOrderBindModalOpen ? (
        <>
          <div className="crm-customer-detail-overlay-mask" onClick={closeOrderBindModal} aria-hidden="true" />
          <div className="crm-customer-detail-modal crm-customer-detail-overlay-modal" role="dialog" aria-modal="true">
            <div className="crm-customer-detail-modal-header">
              <h3>订单绑定</h3>
              <button
                aria-label="关闭订单绑定弹窗"
                className="crm-customer-detail-icon-button"
                type="button"
                onClick={closeOrderBindModal}
              >
                <X size={16} />
              </button>
            </div>
            <div className="crm-customer-detail-inline-form is-modal">
              <div className="crm-customer-detail-order-bind-list">
                {customerOrders.map((order) => {
                  const isChecked = activeTask.linkedOrderIds.includes(order.id);
                  return (
                    <button
                      className={`crm-customer-detail-order-bind-item${isChecked ? ' is-checked' : ''}`}
                      key={order.id}
                      type="button"
                      onClick={() => toggleTaskOrderBinding(order.id)}
                    >
                      <div>
                        <strong>{order.productName}</strong>
                        <span>{order.id}</span>
                      </div>
                      <div>
                        <small>{formatCurrency(order.orderAmount)}</small>
                        <small>{isChecked ? '已绑定' : '点击绑定'}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {activeTask && isProgressModalOpen ? (
        <>
          <div className="crm-customer-detail-overlay-mask" onClick={closeProgressModal} aria-hidden="true" />
          <div className="crm-customer-detail-modal crm-customer-detail-overlay-modal" role="dialog" aria-modal="true">
            <div className="crm-customer-detail-modal-header">
              <h3>提交任务跟进</h3>
              <button
                aria-label="关闭提交任务跟进弹窗"
                className="crm-customer-detail-icon-button"
                type="button"
                onClick={closeProgressModal}
              >
                <X size={16} />
              </button>
            </div>
            <form className="crm-customer-detail-inline-form is-modal" onSubmit={handleSubmitProgress}>
              <div className="crm-customer-detail-form-grid">
                <label>
                  <span>提交人</span>
                  <input
                    value={progressForm.submittedBy}
                    onChange={(event) =>
                      setProgressForm((current) => ({ ...current, submittedBy: event.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>任务状态</span>
                  <select
                    value={progressForm.status}
                    onChange={(event) =>
                      setProgressForm((current) => ({ ...current, status: event.target.value as TaskStatus }))
                    }
                  >
                    <option value="进行中">进行中</option>
                    <option value="有风险">有风险</option>
                    <option value="已完成">已完成</option>
                  </select>
                </label>
                <label className="is-full">
                  <span>跟进说明</span>
                  <textarea
                    value={progressForm.content}
                    onChange={(event) =>
                      setProgressForm((current) => ({ ...current, content: event.target.value }))
                    }
                    placeholder="支持填写本次跟进说明、风险提示和结果反馈"
                  />
                </label>
              </div>
              <div className="crm-customer-detail-attachment-preset-list">
                {ATTACHMENT_PRESETS.map((preset) => (
                  <button
                    className={`crm-customer-detail-attachment-preset${
                      progressForm.attachmentPresetIds.includes(preset.id) ? ' is-selected' : ''
                    }`}
                    key={preset.id}
                    type="button"
                    onClick={() => toggleAttachmentPreset(preset.id)}
                  >
                    <span>IMG</span>
                    <strong>{preset.name}</strong>
                  </button>
                ))}
              </div>
              <div className="crm-customer-detail-form-actions">
                <button className="crm-customer-detail-ghost-button" type="button" onClick={closeProgressModal}>
                  取消
                </button>
                <button className="crm-customer-detail-primary-button" type="submit">
                  提交跟进
                </button>
              </div>
            </form>
          </div>
        </>
      ) : null}

      {isPresaleListOpen ? (
        <>
          <div className="crm-customer-detail-overlay-mask" onClick={closePresaleList} aria-hidden="true" />
          <div
            aria-labelledby="crm-customer-detail-presale-list-title"
            aria-modal="true"
            className="crm-customer-detail-modal crm-customer-detail-overlay-modal"
            role="dialog"
          >
            <div className="crm-customer-detail-modal-header">
              <div>
                <h3 id="crm-customer-detail-presale-list-title">预售打板</h3>
                <p className="crm-customer-detail-drawer-copy">当前客户的预售产品列表。</p>
              </div>
              <button
                aria-label="关闭预售打板列表"
                className="crm-customer-detail-icon-button"
                type="button"
                onClick={closePresaleList}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '8px 20px 20px', maxHeight: '400px', overflowY: 'auto' }}>
              {customerPresaleProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: '13px' }}>
                  当前客户暂无预售产品
                </div>
              ) : (
                <div className="crm-presale-product-inline-list">
                  {customerPresaleProducts.map((presale) => {
                    const activeSpecs = presale.specs.filter((s) => s.proofingStatus !== '已废弃' && s.proofingStatus !== '已转正品');
                    const customerSpecs = presale.specs.filter((s) =>
                      s.customers.some((c) => c.customerId === customerId),
                    );
                    return (
                      <div
                        className={`crm-presale-product-inline-item${activeTask?.linkedOrderIds?.includes(presale.linkedOrderId) ? ' is-linked' : ''}`}
                        key={presale.id}
                        onClick={() => {
                          emitEvent('on_link_presale_product', {
                            presale_product_id: presale.id,
                            customer_id: customerId,
                          });
                        }}
                      >
                        <div className="item-info">
                          <span className="item-name">{presale.productName}</span>
                          <span className="item-meta">
                            {presale.styleCode} · {presale.supplierName} · {presale.category}
                          </span>
                          <span className="item-meta" style={{ marginTop: 2 }}>
                            {customerSpecs.length} 个关联规格 · {activeSpecs.length} 个进行中
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {customerSpecs.slice(0, 2).map((spec) => (
                            <span
                              key={spec.id}
                              className={`crm-presale-product-status-badge ${spec.proofingStatus === '待打板' ? 'is-pending-proof' : spec.proofingStatus === '打板中' ? 'is-proofing' : spec.proofingStatus === '已打板' ? 'is-proofed' : spec.proofingStatus === '已确认' ? 'is-confirmed' : spec.proofingStatus === '已转正品' ? 'is-converted' : 'is-discarded'}`}
                              style={{ fontSize: 10 }}
                            >
                              {spec.platingColor}/{spec.colorName}
                            </span>
                          ))}
                          {customerSpecs.length > 2 ? (
                            <span style={{ fontSize: '10px', color: '#9ca3af' }}>+{customerSpecs.length - 2}</span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}

      <button className="crm-customer-detail-back-button" type="button" onClick={navigateBack}>
        <ArrowLeft size={18} />
      </button>
    </div>
  );
});

export default Component;
