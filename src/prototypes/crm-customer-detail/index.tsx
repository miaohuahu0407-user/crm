/**
 * @name CRM 客户详情页
 *
 * 参考资料：
 * - /rules/development-guide.md
 * - /src/prototypes/crm-customer-detail/spec.md
 * - /src/database/orders.json
 */

import './style.css';

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Boxes,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
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

type GoalTimelineEntry =
  | {
      id: string;
      type: 'progress';
      happenedAt: string;
      title: string;
      submittedBy: string;
      progressPercent: number;
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

type GoalFilter = '全部' | GoalStatus;

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
  progressPercent: string;
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
const GOAL_RAIL_VISIBLE_COUNT = 2;
const GOAL_FILTER_OPTIONS: GoalFilter[] = ['全部', '进行中', '有风险', '已完成'];

const EVENT_LIST: EventItem[] = [
  { name: 'on_back_to_list', desc: '点击返回列表按钮时触发' },
  { name: 'on_create_goal', desc: '创建业绩目标时触发' },
  { name: 'on_select_goal', desc: '切换业绩目标时触发' },
  { name: 'on_create_task', desc: '创建目标任务时触发' },
  { name: 'on_select_task', desc: '打开任务详情抽屉时触发' },
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
];

const ACTION_LIST: Action[] = [];

const VAR_LIST: KeyDesc[] = [
  { name: 'current_customer_id', desc: '当前详情页客户编号' },
  { name: 'selected_goal_id', desc: '当前选中的目标编号' },
  { name: 'selected_task_id', desc: '当前打开的任务编号' },
  { name: 'selected_order_id', desc: '当前高亮的订单编号' },
  { name: 'open_task_count', desc: '当前客户未完成任务数' },
  { name: 'overdue_task_count', desc: '当前客户逾期任务数' },
  { name: 'shipping_address_count', desc: '当前客户收货地址数量' },
  { name: 'contact_count', desc: '当前客户联系人数量' },
  { name: 'tag_count', desc: '当前客户标签数量' },
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
    items: [{ label: '产品列表', icon: <Package size={13} /> }],
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

const DEFAULT_PROGRESS_LOGS: TaskProgressLog[] = [
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

function buildTrendPath(points: number[], width: number, height: number): string {
  const max = Math.max(...points, 1);
  return points
    .map((point, index) => {
      const x = (width / (points.length - 1)) * index;
      const y = height - (point / max) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function toTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatDate(value: string): string {
  if (!value) {
    return '-';
  }
  return value.slice(0, 10);
}

function formatRelativeTime(value: string): string {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
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
  if (productNames.length === 0) {
    return '暂无关联下单';
  }
  if (productNames.length === 1) {
    return productNames[0];
  }
  if (productNames.length === 2) {
    return `${productNames[0]}、${productNames[1]}`;
  }
  return `${productNames.slice(0, 2).join('、')}等${productNames.length}类商品`;
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
  const fallback = ordersDb.records
    .map((item) => normalizeOrderRecord(item as Record<string, unknown>))
    .filter((item) => item.customerId === customerId);
  return fallback.sort((left, right) => toTimestamp(right.orderTime) - toTimestamp(left.orderTime));
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

function getTaskLinkedOrderIds(task: TaskItem): string[] {
  return uniqueIds(task.linkedOrderIds);
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
    progressPercent: '60',
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
  const [goalFilter, setGoalFilter] = useState<GoalFilter>('全部');
  const [selectedGoalId, setSelectedGoalId] = useState<string>(resolveDefaultGoalId(initialGoals));
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
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
  const [progressForm, setProgressForm] = useState<ProgressFormState>(createDefaultProgressForm(operatorName));
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddressRecord[]>(initialShippingAddresses);
  const [shippingAddressForm, setShippingAddressForm] = useState<ShippingAddressFormState>(
    createDefaultShippingAddressForm(initialDetail),
  );
  const [tagForm, setTagForm] = useState<TagFormState>(createDefaultTagForm());
  const [contacts, setContacts] = useState<ContactRecord[]>(initialContacts);
  const [contactForm, setContactForm] = useState<ContactFormState>(createDefaultContactForm());
  const goalRailRef = React.useRef<HTMLDivElement | null>(null);
  const [canScrollGoalsPrev, setCanScrollGoalsPrev] = useState(false);
  const [canScrollGoalsNext, setCanScrollGoalsNext] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'progress' | 'order'>('all');

  const customerOrders = useMemo(
    () => resolveCustomerOrders(dataSource.customer_orders, customerId),
    [dataSource.customer_orders, customerId],
  );

  useEffect(() => {
    if (!goals.some((item) => item.id === selectedGoalId)) {
      setSelectedGoalId(resolveDefaultGoalId(goals));
    }
  }, [goals, selectedGoalId]);

  useEffect(() => {
    const scopedTaskIds = tasks.filter((item) => item.goalId === selectedGoalId).map((item) => item.id);
    if (selectedTaskId && !scopedTaskIds.includes(selectedTaskId)) {
      setSelectedTaskId('');
    }
  }, [tasks, selectedGoalId, selectedTaskId]);

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
  const goalFilterCounts = useMemo<Record<GoalFilter, number>>(
    () =>
      sortedGoals.reduce(
        (counts, goal) => {
          counts.全部 += 1;
          counts[goal.status] += 1;
          return counts;
        },
        { 全部: 0, 进行中: 0, 有风险: 0, 已完成: 0 },
      ),
    [sortedGoals],
  );

  const filteredGoals = useMemo(
    () => (goalFilter === '全部' ? sortedGoals : sortedGoals.filter((item) => item.status === goalFilter)),
    [goalFilter, sortedGoals],
  );
  const showGoalRailControls = filteredGoals.length > GOAL_RAIL_VISIBLE_COUNT;

  const selectedGoal = useMemo(
    () => goals.find((item) => item.id === selectedGoalId) || goals[0],
    [goals, selectedGoalId],
  );

  useEffect(() => {
    const rail = goalRailRef.current;
    if (!rail) {
      setCanScrollGoalsPrev(false);
      setCanScrollGoalsNext(false);
      return;
    }

    const syncGoalRailState = () => {
      const maxScrollLeft = Math.max(rail.scrollWidth - rail.clientWidth, 0);
      setCanScrollGoalsPrev(rail.scrollLeft > 4);
      setCanScrollGoalsNext(rail.scrollLeft < maxScrollLeft - 4);
    };

    syncGoalRailState();
    rail.addEventListener('scroll', syncGoalRailState, { passive: true });

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', syncGoalRailState);
    }

    return () => {
      rail.removeEventListener('scroll', syncGoalRailState);
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', syncGoalRailState);
      }
    };
  }, [filteredGoals.length]);

  useEffect(() => {
    const rail = goalRailRef.current;
    if (!rail || !selectedGoal) {
      return;
    }

    const activeCard = rail.querySelector<HTMLElement>(`[data-goal-id="${selectedGoal.id}"]`);
    activeCard?.scrollIntoView({ behavior: showGoalRailControls ? 'smooth' : 'auto', block: 'nearest', inline: 'nearest' });
  }, [selectedGoal?.id, goalFilter, showGoalRailControls]);

  const goalTasks = useMemo(
    () => tasks.filter((item) => item.goalId === selectedGoal?.id),
    [selectedGoal?.id, tasks],
  );

  const goalTaskIds = useMemo(() => goalTasks.map((item) => item.id), [goalTasks]);

  const selectedTask = useMemo(
    () => tasks.find((item) => item.id === selectedTaskId),
    [tasks, selectedTaskId],
  );

  const selectedTaskLogs = useMemo(
    () =>
      progressLogs
        .filter((item) => item.taskId === selectedTaskId)
        .sort((left, right) => toTimestamp(right.submittedAt) - toTimestamp(left.submittedAt)),
    [progressLogs, selectedTaskId],
  );

  const selectedGoalLogs = useMemo(
    () =>
      progressLogs
        .filter((item) => goalTaskIds.includes(item.taskId))
        .sort((left, right) => toTimestamp(right.submittedAt) - toTimestamp(left.submittedAt)),
    [goalTaskIds, progressLogs],
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

  const selectedGoalOrders = useMemo(
    () => orderedCustomerOrders.filter((order) => selectedGoalLinkedOrderIds.includes(order.id)),
    [orderedCustomerOrders, selectedGoalLinkedOrderIds],
  );

  const selectedGoalOrderAmount = useMemo(
    () => selectedGoalOrders.reduce((sum, order) => sum + order.orderAmount, 0),
    [selectedGoalOrders],
  );

  const selectedGoalPurchaseSummary = useMemo(
    () => summarizePurchasedItems(selectedGoalOrders),
    [selectedGoalOrders],
  );

  const selectedGoalTimelineEntries = useMemo<GoalTimelineEntry[]>(
    () =>
      [
        ...selectedGoalLogs.map((log) => {
          const task = tasks.find((item) => item.id === log.taskId);
          return {
            id: log.id,
            type: 'progress' as const,
            happenedAt: log.submittedAt,
            title: task?.title || '任务进度',
            submittedBy: log.submittedBy,
            progressPercent: log.progressPercent,
            status: log.status,
            content: log.content,
            attachments: log.attachments,
          };
        }),
        ...selectedGoalOrders.map((order) => ({
          id: `order-${order.id}`,
          type: 'order' as const,
          happenedAt: order.orderTime,
          title: `新增订单 · ${order.productName}`,
          createdBy: getOrderCreatedBy(order, selectedGoal?.owner || detail.followUpBy),
          orderAmount: order.orderAmount,
          orderStatus: order.orderStatus,
          content: `${getOrderCreatedBy(order, selectedGoal?.owner || detail.followUpBy)}创建订单，购买${buildOrderPurchaseSummary(order)}。`,
          order,
        })),
      ].sort((left, right) => toTimestamp(right.happenedAt) - toTimestamp(left.happenedAt)),
    [detail.followUpBy, selectedGoal?.owner, selectedGoalLogs, selectedGoalOrders, tasks],
  );

  const filteredTimelineEntries = useMemo(
    () =>
      timelineFilter === 'all'
        ? selectedGoalTimelineEntries
        : selectedGoalTimelineEntries.filter((entry) => entry.type === timelineFilter),
    [selectedGoalTimelineEntries, timelineFilter],
  );

  const trendPath = useMemo(() => buildTrendPath(detail.trendPoints, 270, 140), [detail.trendPoints]);
  const trendAreaPath = `${trendPath} L 270 140 L 0 140 Z`;

    const openTaskCount = tasks.filter((item) => item.status !== '已完成').length;
  const overdueTaskCount = tasks.filter((item) => isTaskOverdue(item)).length;
  const latestOrderAt = customerOrders[0]?.orderTime || detail.lastOrderAt;

  const profileFields = [
    ['客户编号', detail.id],
    ['归属', detail.owner],
    ['跟进人', detail.followUpBy],
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
    setSelectedTaskId('');
    setSelectedOrderId('');
    setTimelineFilter('all');
    emitEvent('on_select_goal', { customer_id: detail.id, goal_id: goalId });
  }

  function handleGoalRailScroll(direction: 'prev' | 'next') {
    const rail = goalRailRef.current;
    if (!rail) {
      return;
    }

    const gap = 12;
    const firstCard = rail.querySelector<HTMLElement>('.crm-customer-detail-goal-card');
    const cardWidth = firstCard?.getBoundingClientRect().width || (rail.clientWidth - gap) / GOAL_RAIL_VISIBLE_COUNT;
    const step = (cardWidth + gap) * GOAL_RAIL_VISIBLE_COUNT;
    rail.scrollBy({
      left: direction === 'next' ? step : -step,
      behavior: 'smooth',
    });
  }

  function handleOpenTask(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }
    if (task.goalId !== selectedGoalId) {
      setSelectedGoalId(task.goalId);
    }
    setSelectedTaskId(taskId);
    emitEvent('on_select_task', { customer_id: detail.id, goal_id: task.goalId, task_id: taskId });
  }

  function closeTaskDrawer() {
    setSelectedTaskId('');
    setIsOrderBindModalOpen(false);
    setIsProgressModalOpen(false);
  }

  function openOrderOverviewModal() {
    setIsOrderOverviewModalOpen(true);
  }

  function closeOrderOverviewModal() {
    setIsOrderOverviewModalOpen(false);
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

  function openProgressModal() {
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
    setTaskForm(createDefaultTaskForm(detail.followUpBy));
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
    setSelectedTaskId(nextTask.id);
    setIsTaskFormOpen(false);
    setTaskForm(createDefaultTaskForm(detail.followUpBy));
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
    if (!selectedTask) {
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
    const nextLog: TaskProgressLog = {
      id: makeId('log'),
      taskId: selectedTask.id,
      customerId: detail.id,
      submittedBy: progressForm.submittedBy || operatorName,
      submittedAt,
      progressPercent: Number(progressForm.progressPercent || 0),
      content: progressForm.content || '已提交新进度',
      status: progressForm.status,
      attachments: attachmentItems,
    };

    setProgressLogs((current) => [nextLog, ...current]);
    setTasks((current) =>
      current.map((item) =>
        item.id === selectedTask.id
          ? {
              ...item,
              status:
                Number(progressForm.progressPercent || 0) >= 100
                  ? '已完成'
                  : progressForm.status === '未开始'
                    ? '进行中'
                    : progressForm.status,
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
      task_id: selectedTask.id,
      goal_id: selectedTask.goalId,
      submitted_at: submittedAt,
      progress_percent: Number(progressForm.progressPercent || 0),
    });
  }

  function toggleTaskOrderBinding(orderId: string) {
    if (!selectedTask) {
      return;
    }

    const isLinked = selectedTask.linkedOrderIds.includes(orderId);
    const nextOrderIds = isLinked
      ? selectedTask.linkedOrderIds.filter((item) => item !== orderId)
      : [...selectedTask.linkedOrderIds, orderId];

    setTasks((current) =>
      current.map((item) =>
        item.id === selectedTask.id
          ? {
              ...item,
              linkedOrderIds: uniqueIds(nextOrderIds),
            }
          : item,
      ),
    );

    emitEvent('on_link_task_orders', {
      customer_id: detail.id,
      goal_id: selectedTask.goalId,
      task_id: selectedTask.id,
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
          selected_task_id: selectedTask?.id || '',
          selected_order_id: selectedOrderId,
          open_task_count: openTaskCount,
          overdue_task_count: overdueTaskCount,
          shipping_address_count: shippingAddresses.length,
          tag_count: detail.tags.length,
          contact_count: contacts.length,
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
      selectedGoal?.id,
      selectedOrderId,
      selectedTask?.id,
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
                <div>
                  <div className="crm-customer-detail-profile-title">{detail.displayName}</div>
                </div>
                <button className="crm-customer-detail-link-button" type="button" aria-label="搜索客户">
                  <Search size={12} />
                </button>
              </div>
            </div>

            <div className="crm-customer-detail-profile-list">
              {profileFields.map(([label, value]) => (
                <div className="crm-customer-detail-profile-row" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div className="crm-customer-detail-profile-summary">
              <div className="crm-customer-detail-profile-tags-title">客户经营摘要</div>
              <button
                aria-label="查看关联订单"
                className="crm-customer-detail-profile-summary-card is-featured is-combined"
                type="button"
                onClick={openOrderOverviewModal}
              >
                {profileSummaryCards.map((item) => (
                  <div className="crm-customer-detail-profile-summary-stat" key={item.label}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </button>
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
              {activeTab === 'goal' && (
                <div className="crm-customer-detail-workspace-actions">
                  <button
                    className="crm-customer-detail-secondary-button"
                    type="button"
                    onClick={() => setIsGoalFormOpen(true)}
                  >
                    <Plus size={12} />
                    新建目标
                  </button>
                </div>
              )}
            </div>

            <div className="crm-customer-detail-workspace">
              {activeTab === 'goal' ? (
                <React.Fragment>
                  <div className="crm-customer-detail-workspace-main">
                    <section className="crm-customer-detail-panel">
                      <div className="crm-customer-detail-panel-header">
                        <div>
                          <div className="crm-customer-detail-section-title">
                            <span className="crm-customer-detail-section-bar" />
                            <span>业绩目标</span>
                          </div>
                        </div>
                        <div className="crm-customer-detail-goal-toolbar">
                          <div className="crm-customer-detail-filter-group">
                            {GOAL_FILTER_OPTIONS.map((item) => (
                              <button
                                className={`crm-customer-detail-filter-pill${goalFilter === item ? ' is-active' : ''}`}
                                key={item}
                                type="button"
                                onClick={() => setGoalFilter(item)}
                              >
                                {`${item}（${goalFilterCounts[item]}）`}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="crm-customer-detail-goal-carousel">
                        <div
                          className={`crm-customer-detail-goal-rail${showGoalRailControls ? ' is-scrollable' : ''}`}
                          ref={goalRailRef}
                        >
                      {filteredGoals.length > 0 ? (
                        filteredGoals.map((goal) => {
                          const summary = getGoalTaskSummary(goal, tasks);
                          const linkedOrderCount = uniqueIds([
                            ...goal.linkedOrderIds,
                            ...tasks.filter((item) => item.goalId === goal.id).flatMap((item) => item.linkedOrderIds),
                          ]).length;
                          const goalTaskStatus = tasks
                            .filter((item) => item.goalId === goal.id)
                            .sort((a, b) => toTimestamp(b.latestProgressAt) - toTimestamp(a.latestProgressAt))[0]
                            ?.status || goal.status;
                          return (
                            <button
                              className={`crm-customer-detail-goal-card${selectedGoal?.id === goal.id ? ' is-selected' : ''}`}
                              data-goal-id={goal.id}
                              key={goal.id}
                              type="button"
                              onClick={() => handleSelectGoal(goal.id)}
                            >
                              <div className="crm-customer-detail-goal-top">
                                <span className={`crm-customer-detail-status-badge ${getStatusClass(goalTaskStatus)}`}>
                                  {goalTaskStatus}
                                </span>
                              </div>
                              <strong>{goal.title}</strong>
                              <p>{goal.summary}</p>
                              <div className="crm-customer-detail-goal-metric">
                                <span>{summary.headline}</span>
                                {summary.progressText ? <span>{summary.progressText}</span> : null}
                              </div>
                              <div className="crm-customer-detail-progress-track">
                                <span style={{ width: `${summary.percent}%` }} />
                              </div>
                              <div className="crm-customer-detail-goal-meta">
                                <span>负责人：{goal.owner}</span>
                                <span>截止：{goal.endDate}</span>
                                <span>关联订单：{linkedOrderCount}</span>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="crm-customer-detail-empty-card">当前筛选条件下暂无目标，可直接新建目标。</div>
                      )}
                    </div>
                    {showGoalRailControls && canScrollGoalsPrev ? (
                      <button
                        className="crm-customer-detail-goal-carousel-button is-left"
                        type="button"
                        aria-label="查看上一组目标"
                        onClick={() => handleGoalRailScroll('prev')}
                      >
                        <ChevronLeft size={18} />
                      </button>
                    ) : null}
                    {showGoalRailControls && canScrollGoalsNext ? (
                      <button
                        className="crm-customer-detail-goal-carousel-button is-right"
                        type="button"
                        aria-label="查看下一组目标"
                        onClick={() => handleGoalRailScroll('next')}
                      >
                        <ChevronRight size={18} />
                      </button>
                    ) : null}
                  </div>
                  <div className="crm-customer-detail-goal-task-section">
                  <div className="crm-customer-detail-panel-header">
                    <div>
                      <div className="crm-customer-detail-section-title">
                        <span className="crm-customer-detail-section-bar" />
                        <span>目标下任务</span>
                      </div>
                                          </div>
                    <div className="crm-customer-detail-panel-summary">
                      <span>任务数 {goalTasks.length}</span>
                      <span>进行中 {goalTasks.filter((item) => item.status === '进行中').length}</span>
                      <span>风险 {goalTasks.filter((item) => item.status === '有风险').length}</span>
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
                          <h3 id="crm-customer-detail-task-modal-title">新建目标下任务</h3>
                          <button
                            aria-label="关闭新建任务弹窗"
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

                  <div className="crm-customer-detail-task-table">
                    <div className="crm-customer-detail-task-head">
                      <span>任务名称</span>
                      <span>状态</span>
                      <span>优先级</span>
                      <span>指定人</span>
                      <span>目标日期</span>
                      <span>关联订单</span>
                      <span>最近更新</span>
                      <span>操作</span>
                    </div>
                    {goalTasks.length > 0 ? (
                      goalTasks.map((task) => {
                        const latestLog = getTaskLatestLog(progressLogs, task.id);
                        const isOrderRelated = selectedOrderId ? task.linkedOrderIds.includes(selectedOrderId) : false;
                        return (
                          <div
                            className={`crm-customer-detail-task-row${selectedTask?.id === task.id ? ' is-selected' : ''}${
                              isOrderRelated ? ' is-linked' : ''
                            }`}
                            key={task.id}
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
                              {task.dueDate}
                            </span>
                            <span>{getTaskLinkedOrderIds(task).length}</span>
                            <span>{latestLog ? formatDate(latestLog.submittedAt) : '-'}</span>
                            <div className="crm-customer-detail-task-actions">
                              <button type="button" onClick={() => handleOpenTask(task.id)}>
                                查看
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="crm-customer-detail-empty-row">当前目标下暂无任务，可直接新建任务。</div>
                    )}
                  </div>
                  </div>
                </section>
              </div>

              <aside className="crm-customer-detail-workspace-side">
                <section className="crm-customer-detail-panel crm-customer-detail-timeline-panel">
                  <div className="crm-customer-detail-panel-header crm-customer-detail-timeline-header">
                    <div className="crm-customer-detail-timeline-header-top">
                      <strong className="crm-customer-detail-timeline-summary-title">目标跟进总结</strong>
                      <div className="crm-customer-detail-panel-summary crm-customer-detail-panel-summary-inline">
                        <button
                          className={`crm-customer-detail-timeline-filter-chip${timelineFilter === 'progress' ? ' is-active' : ''}`}
                          type="button"
                          onClick={() => setTimelineFilter((prev) => (prev === 'progress' ? 'all' : 'progress'))}
                        >
                          跟进次数 {selectedGoalLogs.length}
                        </button>
                        <button
                          className={`crm-customer-detail-timeline-filter-chip${timelineFilter === 'order' ? ' is-active' : ''}`}
                          type="button"
                          onClick={() => setTimelineFilter((prev) => (prev === 'order' ? 'all' : 'order'))}
                        >
                          下单笔数 {selectedGoalOrders.length}
                        </button>
                      </div>
                    </div>
                    <div className="crm-customer-detail-timeline-summary-meta">
                      <span>订单金额：{formatCurrency(selectedGoalOrderAmount)}</span>
                      <span>主要购买：{selectedGoalPurchaseSummary}</span>
                    </div>
                  </div>
                  <div className="crm-customer-detail-timeline-layout">
                    <div className="crm-customer-detail-timeline">
                      {filteredTimelineEntries.length > 0 ? (
                        filteredTimelineEntries.map((entry) => (
                          <article className={`crm-customer-detail-timeline-item is-${entry.type}`} key={entry.id}>
                            <div className={`crm-customer-detail-timeline-dot is-${entry.type}`} />
                            <div className="crm-customer-detail-timeline-content">
                              <div className="crm-customer-detail-timeline-head">
                                <strong>{entry.title}</strong>
                                <span>{formatRelativeTime(entry.happenedAt)}</span>
                              </div>
                              {entry.type === 'progress' ? (
                                <>
                                  <div className="crm-customer-detail-timeline-meta">
                                    <span>{entry.submittedBy}</span>
                                    <span>{entry.progressPercent}%</span>
                                    <span className={`crm-customer-detail-status-badge ${getStatusClass(entry.status)}`}>
                                      {entry.status}
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
                                  <div className="crm-customer-detail-timeline-meta">
                                    <span>创建人：{entry.createdBy}</span>
                                    <span>金额：{formatCurrency(entry.orderAmount)}</span>
                                    <span>{entry.orderStatus}</span>
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
                        <div className="crm-customer-detail-empty-card">当前目标下暂无进度和订单动态。</div>
                      )}
                    </div>
                  </div>
                </section>
              </aside>
                </React.Fragment>
              ) : null}
            </div>

            {activeTab === 'goal' && (
            <section className="crm-customer-detail-analysis-grid">
              <article className="crm-customer-detail-panel">
                <div className="crm-customer-detail-chart-header">
                  <div>
                    <div className="crm-customer-detail-section-title">
                      <span className="crm-customer-detail-section-bar" />
                      <span>消费趋势</span>
                    </div>
                    <p>作为任务执行后的结果视角，观察近阶段消费变化。</p>
                  </div>
                  <div className="crm-customer-detail-date-range">
                    <span>2025-10</span>
                    <span>-</span>
                    <span>2026-04</span>
                  </div>
                </div>
                <svg className="crm-customer-detail-trend-chart" viewBox="0 0 300 170" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((line) => (
                    <line
                      key={line}
                      x1="20"
                      y1={20 + line * 30}
                      x2="290"
                      y2={20 + line * 30}
                      className="grid-line"
                    />
                  ))}
                  <path d={trendAreaPath} className="area-path" />
                  <path d={trendPath} className="line-path" />
                  {['2025-10', '2025-12', '2026-02', '2026-04'].map((label, index) => (
                    <text key={label} x={25 + index * 78} y="163" className="axis-text">
                      {label}
                    </text>
                  ))}
                </svg>
              </article>

              <article className="crm-customer-detail-panel">
                <div className="crm-customer-detail-chart-header">
                  <div>
                    <div className="crm-customer-detail-section-title">
                      <span className="crm-customer-detail-section-bar" />
                      <span>消费占比</span>
                    </div>
                    <p>结合目标推进和订单绑定，快速看客户经营价值。</p>
                  </div>
                </div>
                <svg className="crm-customer-detail-bar-chart" viewBox="0 0 300 190" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((line) => (
                    <line
                      key={line}
                      x1="22"
                      y1={24 + line * 28}
                      x2="290"
                      y2={24 + line * 28}
                      className="grid-line"
                    />
                  ))}
                  <rect
                    x="110"
                    y={164 - detail.consumePercent}
                    width="95"
                    height={detail.consumePercent}
                    rx="2"
                    className="bar-rect"
                  />
                  <text x="130" y="182" className="axis-text">
                    客户经营占比
                  </text>
                </svg>
              </article>
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
                  <span>负责人</span>
                  <input
                    value={goalForm.owner}
                    onChange={(event) => setGoalForm((current) => ({ ...current, owner: event.target.value }))}
                  />
                </label>
                <label>
                  <span>截止日期</span>
                  <input
                    value={goalForm.endDate}
                    onChange={(event) => setGoalForm((current) => ({ ...current, endDate: event.target.value }))}
                  />
                </label>
                <label>
                  <span>目标状态</span>
                  <select
                    value={goalForm.status}
                    onChange={(event) =>
                      setGoalForm((current) => ({ ...current, status: event.target.value as GoalStatus }))
                    }
                  >
                    <option value="进行中">进行中</option>
                    <option value="有风险">有风险</option>
                    <option value="已完成">已完成</option>
                  </select>
                </label>
                <label>
                  <span>目标金额</span>
                  <input
                    value={goalForm.targetAmount}
                    onChange={(event) => setGoalForm((current) => ({ ...current, targetAmount: event.target.value }))}
                  />
                </label>
                <label>
                  <span>当前金额</span>
                  <input
                    value={goalForm.currentAmount}
                    onChange={(event) => setGoalForm((current) => ({ ...current, currentAmount: event.target.value }))}
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

      {selectedTask ? (
        <div className="crm-customer-detail-drawer-mask" onClick={closeTaskDrawer} aria-hidden="true" />
      ) : null}

      {selectedTask ? (
        <aside className="crm-customer-detail-drawer">
          <div className="crm-customer-detail-drawer-header">
            <div>
              <h3>{selectedTask.title}</h3>
            </div>
            <button className="crm-customer-detail-ghost-button" type="button" onClick={closeTaskDrawer}>
              收起
            </button>
          </div>
          <div className="crm-customer-detail-drawer-body">
            <section className="crm-customer-detail-drawer-section">
              <div className="crm-customer-detail-detail-grid">
                <div>
                  <span>所属目标</span>
                  <strong>{selectedGoal?.title || '-'}</strong>
                </div>
                <div>
                  <span>指定人</span>
                  <strong>{selectedTask.assignee}</strong>
                </div>
                <div>
                  <span>目标日期</span>
                  <strong>{selectedTask.dueDate}</strong>
                </div>
                <div>
                  <span>任务状态</span>
                  <strong>{selectedTask.status}</strong>
                </div>
                <div>
                  <span>优先级</span>
                  <strong>{selectedTask.priority}</strong>
                </div>
                <div>
                  <span>关联订单</span>
                  <strong>{selectedTask.linkedOrderIds.length}</strong>
                </div>
                <div>
                  <span>最近更新</span>
                  <strong>{selectedTask.latestProgressAt || '-'}</strong>
                </div>
                <div className="is-full">
                  <span>任务说明</span>
                  <strong>{selectedTask.description}</strong>
                </div>
              </div>
            </section>

            <section className="crm-customer-detail-drawer-section">
              <div className="crm-customer-detail-section-title">
                <span className="crm-customer-detail-section-bar" />
                <span>关联订单</span>
              </div>
              <button
                className="crm-customer-detail-drawer-link-card"
                type="button"
                onClick={() => setIsOrderBindModalOpen(true)}
              >
                <div>
                  <strong>已关联 {selectedTask.linkedOrderIds.length} 个订单</strong>
                  <span>
                    {selectedTask.linkedOrderIds.length > 0
                      ? selectedTask.linkedOrderIds.join('、')
                      : '当前未绑定订单'}
                  </span>
                </div>
                <span>点击展开订单绑定</span>
              </button>
            </section>

            <section className="crm-customer-detail-drawer-section">
              <div className="crm-customer-detail-section-title">
                <span className="crm-customer-detail-section-bar" />
              </div>
              {selectedTaskLogs[0] ? (
                <div className="crm-customer-detail-latest-progress">
                  <div>
                    <span>最新提交人</span>
                    <strong>{selectedTaskLogs[0].submittedBy}</strong>
                  </div>
                  <div>
                    <span>提交时间</span>
                    <strong>{selectedTaskLogs[0].submittedAt}</strong>
                  </div>
                  <div>
                    <span>进度</span>
                    <strong>{selectedTaskLogs[0].progressPercent}%</strong>
                  </div>
                  <div>
                    <span>任务状态</span>
                    <strong>{selectedTaskLogs[0].status}</strong>
                  </div>
                  <div>
                    <span>附件数</span>
                    <strong>{selectedTaskLogs[0].attachments.length}</strong>
                  </div>
                  <div className="is-full">
                    <span>进度说明</span>
                    <p>{selectedTaskLogs[0].content}</p>
                  </div>
                  {selectedTaskLogs[0].attachments.length > 0 ? (
                    <div className="crm-customer-detail-attachment-list crm-customer-detail-latest-progress-attachments">
                      {selectedTaskLogs[0].attachments.map((attachment) => (
                        <div className={`crm-customer-detail-attachment-card is-${attachment.previewMode}`} key={attachment.id}>
                          <span>IMG</span>
                          <strong>{attachment.name}</strong>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="crm-customer-detail-empty-card">当前任务还没有进度记录。</div>
              )}
            </section>

            <section className="crm-customer-detail-drawer-section">
              <div className="crm-customer-detail-section-title">
                <span className="crm-customer-detail-section-bar" />
                <span>进度时间线</span>
              </div>
              <div className="crm-customer-detail-timeline is-drawer">
                {selectedTaskLogs.length > 0 ? (
                  selectedTaskLogs.map((log) => (
                    <article className="crm-customer-detail-timeline-item" key={log.id}>
                      <div className="crm-customer-detail-timeline-dot" />
                      <div className="crm-customer-detail-timeline-content">
                        <div className="crm-customer-detail-timeline-head">
                          <strong>{log.submittedBy}</strong>
                          <span>{log.submittedAt}</span>
                        </div>
                        <div className="crm-customer-detail-timeline-meta">
                          <span>{log.progressPercent}%</span>
                          <span className={`crm-customer-detail-status-badge ${getStatusClass(log.status)}`}>
                            {log.status}
                          </span>
                        </div>
                        <p>{log.content}</p>
                        {log.attachments.length > 0 ? (
                          <div className="crm-customer-detail-attachment-list">
                            {log.attachments.map((attachment) => (
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
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="crm-customer-detail-empty-card">暂无进度记录。</div>
                )}
              </div>
            </section>
          </div>

          <div className="crm-customer-detail-drawer-footer">
            <button className="crm-customer-detail-primary-button" type="button" onClick={openProgressModal}>
              提交任务进度
            </button>
          </div>
        </aside>
      ) : null}

      {selectedTask && isOrderBindModalOpen ? (
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
                  const isChecked = selectedTask.linkedOrderIds.includes(order.id);
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

      {selectedTask && isProgressModalOpen ? (
        <>
          <div className="crm-customer-detail-overlay-mask" onClick={closeProgressModal} aria-hidden="true" />
          <div className="crm-customer-detail-modal crm-customer-detail-overlay-modal" role="dialog" aria-modal="true">
            <div className="crm-customer-detail-modal-header">
              <h3>提交任务进度</h3>
              <button
                aria-label="关闭提交进度弹窗"
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
                  <span>进度%</span>
                  <input
                    value={progressForm.progressPercent}
                    onChange={(event) =>
                      setProgressForm((current) => ({ ...current, progressPercent: event.target.value }))
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
                  <span>进度说明</span>
                  <textarea
                    value={progressForm.content}
                    onChange={(event) =>
                      setProgressForm((current) => ({ ...current, content: event.target.value }))
                    }
                    placeholder="支持文字说明、节点风险和结果反馈"
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
                  提交进度
                </button>
              </div>
            </form>
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
