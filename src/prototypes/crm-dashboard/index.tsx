/**
 * @name CRM 客户经营驾驶舱
 *
 * 参考资料：
 * - /rules/development-guide.md
 * - /src/prototypes/crm-dashboard/spec.md
 */

import './style.css';

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  ChevronLeft,
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
  Star,
  Target,
  TriangleAlert,
  Truck,
  UserRound,
  Users,
  Wallet,
  Warehouse,
  X,
} from 'lucide-react';

import type {
  Action,
  AxureHandle,
  AxureProps,
  ConfigItem,
  DataDesc,
  EventItem,
  KeyDesc,
} from '../../common/axure-types';

type ViewMode = 'leader' | 'sales';
type GoalStatus = '进行中' | '有风险' | '已完成';
type TaskStatus = '未开始' | '进行中' | '有风险' | '已完成';
type TaskPriority = '高' | '中' | '低';
type ImportanceLevel = 'A' | 'B' | 'C';
type SeverityLevel = '高' | '中' | '低';

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

type CustomerRecord = {
  id: string;
  name: string;
  owner: string;
  followUpBy: string;
  customerType: string;
  annualAmount: number;
  region: string;
  tags: string[];
  createdAt: string;
  lastFollowAt: string;
  lastOrderAt: string;
  importanceLevel: ImportanceLevel;
  nextFollowUpAt: string;
};

type GoalRecord = {
  id: string;
  customerId: string;
  title: string;
  owner: string;
  status: GoalStatus;
  targetAmount?: number;
  currentAmount?: number;
  startDate: string;
  endDate: string;
  summary: string;
};

type TaskRecord = {
  id: string;
  goalId: string;
  customerId: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  latestProgressAt: string;
  description: string;
};

type DashboardTaskFormState = {
  title: string;
  assignee: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  description: string;
};

type DashboardProgressFormState = {
  submittedBy: string;
  progressPercent: string;
  status: TaskStatus;
  content: string;
};

type ProgressLog = {
  id: string;
  taskId: string;
  customerId: string;
  submittedBy: string;
  submittedAt: string;
  progressPercent: number;
  content: string;
  status: TaskStatus;
};

type OrderRecord = {
  id: string;
  customerId: string;
  customerName: string;
  orderTime: string;
  createdBy: string;
  productName: string;
  orderAmount: number;
  orderStatus: string;
};

type DashboardSummary = {
  view: ViewMode;
  owner: string;
  targetAmount: number;
  currentAmount: number;
  progressRate: number;
  customerCount: number;
  activeCustomerCount: number;
  keyCustomerCount: number;
  riskCustomerCount: number;
  dueTodayCount: number;
  overdueTaskCount: number;
  needLeaderAttentionCount: number;
};

type DashboardCustomerRow = {
  customerId: string;
  customerName: string;
  owner: string;
  followUpBy: string;
  importanceLevel: ImportanceLevel;
  lastFollowAt: string;
  lastOrderAt: string;
  annualAmount: number;
  riskGoalCount: number;
  inProgressGoalCount: number;
  openTaskCount: number;
  highPriorityOpenTaskCount: number;
  riskTaskCount: number;
  inProgressTaskCount: number;
  attentionStatus: string;
};

type DashboardAlert = {
  id: string;
  view: ViewMode | 'all';
  owner: string;
  severity: SeverityLevel;
  alertType: string;
  customerId: string;
  customerName: string;
  reason: string;
  dueAt: string;
  suggestedAction: string;
};

type CustomerFilterKey = 'all' | 'focus' | 'progressing' | 'idle' | 'priority';
type DashboardGoalFilter = '全部' | GoalStatus;

type SalespersonRow = {
  salespersonName: string;
  managedCustomerCount: number;
  keyCustomerCount: number;
  targetAmount: number;
  currentAmount: number;
  progressRate: number;
  riskGoalCount: number;
  overdueTaskCount: number;
  lastFollowAt: string;
};

const TODAY = '2026-04-24';
const DEFAULT_OWNER = '陈敏';
const PAGE_TAGS = ['仪表盘', '客户驾驶舱', '客户列表', '客户360'];
const DASHBOARD_GOAL_FILTER_OPTIONS: DashboardGoalFilter[] = ['全部', '进行中', '有风险', '已完成'];

const EVENT_LIST: EventItem[] = [
  { name: 'on_switch_view', desc: '切换视角时触发' },
  { name: 'on_open_sales_view', desc: '领导视角下钻业务员时触发' },
  { name: 'on_change_owner_filter', desc: '切换业务员时触发' },
  { name: 'on_view_customer', desc: '点击客户时触发' },
];

const ACTION_LIST: Action[] = [
  { name: 'set_view', desc: '切换领导视角或业务员视角', params: 'leader | sales' },
  { name: 'set_owner', desc: '切换当前业务员', params: '业务员姓名' },
];

const VAR_LIST: KeyDesc[] = [
  { name: 'current_view', desc: '当前页面视角' },
  { name: 'current_owner', desc: '当前业务员' },
  { name: 'customer_count', desc: '当前视角客户数量' },
  { name: 'alert_count', desc: '当前视角风险提醒数量' },
  { name: 'key_customer_count', desc: '当前视角重点客户数量' },
  { name: 'overdue_task_count', desc: '当前视角逾期任务数量' },
];

const CONFIG_LIST: ConfigItem[] = [
  {
    type: 'input',
    attributeId: 'operator_name',
    displayName: '操作人名称',
    info: '显示在页面右上角的操作人名称',
    initialValue: '阿塔咪',
  },
];

const DATA_LIST: DataDesc[] = [
  {
    name: 'customers',
    desc: '客户基础数据',
    keys: [
      { name: 'id', desc: '客户编号' },
      { name: 'name', desc: '客户名称' },
      { name: 'owner', desc: '归属人' },
      { name: 'follow_up_by', desc: '跟进人' },
      { name: 'annual_amount', desc: '近一年累计金额' },
      { name: 'last_follow_at', desc: '最近跟进时间' },
      { name: 'last_order_at', desc: '最近下单时间' },
      { name: 'tags', desc: '客户标签' },
      { name: 'importance_level', desc: '客户重要度' },
      { name: 'next_follow_up_at', desc: '下次跟进时间' },
    ],
  },
  {
    name: 'goal_targets',
    desc: '客户目标数据',
    keys: [
      { name: 'id', desc: '目标编号' },
      { name: 'customer_id', desc: '客户编号' },
      { name: 'title', desc: '目标名称' },
      { name: 'owner', desc: '目标负责人' },
      { name: 'status', desc: '目标状态' },
      { name: 'target_amount', desc: '目标金额' },
      { name: 'current_amount', desc: '当前金额' },
    ],
  },
  {
    name: 'task_items',
    desc: '任务数据',
    keys: [
      { name: 'id', desc: '任务编号' },
      { name: 'goal_id', desc: '所属目标编号' },
      { name: 'customer_id', desc: '客户编号' },
      { name: 'title', desc: '任务名称' },
      { name: 'assignee', desc: '指定人' },
      { name: 'due_date', desc: '截止日期' },
      { name: 'status', desc: '任务状态' },
      { name: 'priority', desc: '优先级' },
      { name: 'latest_progress_at', desc: '最近进度时间' },
    ],
  },
  {
    name: 'task_progress_logs',
    desc: '任务进度数据',
    keys: [
      { name: 'id', desc: '进度编号' },
      { name: 'task_id', desc: '任务编号' },
      { name: 'customer_id', desc: '客户编号' },
      { name: 'submitted_by', desc: '提交人' },
      { name: 'submitted_at', desc: '提交时间' },
      { name: 'progress_percent', desc: '进度百分比' },
      { name: 'status', desc: '进度状态' },
    ],
  },
  {
    name: 'customer_orders',
    desc: '订单数据',
    keys: [
      { name: 'id', desc: '订单编号' },
      { name: 'customer_id', desc: '客户编号' },
      { name: 'customer_name', desc: '客户名称' },
      { name: 'order_time', desc: '下单时间' },
      { name: 'created_by', desc: '创建人' },
      { name: 'product_name', desc: '商品名称' },
      { name: 'order_amount', desc: '订单金额' },
      { name: 'order_status', desc: '订单状态' },
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
      { label: '产品组合', icon: <Boxes size={13} /> },
      { label: '团购列表', icon: <FileText size={13} /> },
    ],
  },
  {
    label: '销售管理',
    icon: <ShoppingBag size={14} />,
    items: [
      { label: '客户驾驶舱', icon: <BarChart3 size={13} />, active: true },
      { label: '客户列表', icon: <Users size={13} /> },
      { label: '订单列表', icon: <FileText size={13} /> },
    ],
  },
  {
    label: '采购管理',
    icon: <ShoppingCart size={14} />,
    items: [
      { label: '库存预警', icon: <Bell size={13} /> },
      { label: '待采购列表', icon: <Clock3 size={13} /> },
      { label: '已采购列表', icon: <FileText size={13} /> },
      { label: '供应商列表', icon: <UserRound size={13} /> },
    ],
  },
  {
    label: '仓储管理',
    icon: <Warehouse size={14} />,
    items: [
      { label: '实时库存', icon: <Warehouse size={13} /> },
      { label: '入库列表', icon: <FileText size={13} /> },
      { label: '发货列表', icon: <Truck size={13} /> },
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

const DEFAULT_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'K2604100347139123',
    name: '胡******户',
    owner: '黄家颖',
    followUpBy: '陈敏',
    customerType: '零售商',
    annualAmount: 45000,
    region: '百慕大',
    tags: ['重点培育', '新品敏感', '预售跟紧'],
    createdAt: '2026-04-10 15:47:14',
    lastFollowAt: '2026-04-21 18:20:00',
    lastOrderAt: '2026-04-22 16:35:40',
    importanceLevel: 'A',
    nextFollowUpAt: '2026-04-24 18:00:00',
  },
  {
    id: 'K2604210349432034',
    name: '谭****息',
    owner: '阿塔咪',
    followUpBy: '陈敏',
    customerType: '零售商',
    annualAmount: 18200,
    region: '阿尔巴尼亚',
    tags: ['很关注A产品', '可复购'],
    createdAt: '2026-04-21 15:49:44',
    lastFollowAt: '2026-04-22 09:30:00',
    lastOrderAt: '2026-04-22 15:50:10',
    importanceLevel: 'B',
    nextFollowUpAt: '2026-04-25 10:00:00',
  },
  {
    id: 'K2604211152018593',
    name: '谭*******息',
    owner: '陈敏',
    followUpBy: '陈敏',
    customerType: '个人买家',
    annualAmount: 9800,
    region: '奥兰群岛',
    tags: ['打板关注', '小单高频'],
    createdAt: '2026-04-21 11:52:01',
    lastFollowAt: '2026-04-22 17:45:00',
    lastOrderAt: '2026-04-22 18:55:00',
    importanceLevel: 'C',
    nextFollowUpAt: '2026-04-24 14:00:00',
  },
];

const DEFAULT_GOALS: GoalRecord[] = [
  {
    id: 'goal-001',
    customerId: 'K2604100347139123',
    title: '4月新品首发转化目标',
    owner: '陈敏',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    status: '进行中',
    targetAmount: 60000,
    currentAmount: 43200,
    summary: '围绕新品推送、预售打板和复购订单推进本月首发金额。',
  },
  {
    id: 'goal-002',
    customerId: 'K2604100347139123',
    title: '预售礼盒打板里程碑',
    owner: '黄家颖',
    startDate: '2026-04-12',
    endDate: '2026-05-08',
    status: '有风险',
    summary: '完成礼盒包装打板、样板确认和预售上架节奏。',
  },
  {
    id: 'goal-007',
    customerId: 'K2604100347139123',
    title: '母亲节档期备货风险化解',
    owner: '黄家颖',
    startDate: '2026-04-14',
    endDate: '2026-05-05',
    status: '有风险',
    summary: '聚焦母亲节档期预售备货和赠品确认，优先处理打样延期与备货节奏风险。',
  },
  {
    id: 'goal-008',
    customerId: 'K2604100347139123',
    title: '三月老客复购冲刺收官',
    owner: '陈敏',
    startDate: '2026-03-18',
    endDate: '2026-04-18',
    status: '已完成',
    targetAmount: 30000,
    currentAmount: 32600,
    summary: '通过老客回访、补货提醒和加购组合推荐完成阶段复购金额目标。',
  },
  {
    id: 'goal-003',
    customerId: 'K2604210349432034',
    title: 'A产品组合复购拉升',
    owner: '阿塔咪',
    startDate: '2026-04-10',
    endDate: '2026-05-15',
    status: '进行中',
    targetAmount: 50000,
    currentAmount: 17800,
    summary: '通过套餐推荐和订单节奏管理提升月度复购额。',
  },
  {
    id: 'goal-004',
    customerId: 'K2604210349432034',
    title: '新品B首单推进',
    owner: '陈敏',
    startDate: '2026-04-18',
    endDate: '2026-05-01',
    status: '进行中',
    summary: '先推送新品资料，再完成下单确认与交付节奏。',
  },
  {
    id: 'goal-005',
    customerId: 'K2604211152018593',
    title: '预售样板确认与下单',
    owner: '陈敏',
    startDate: '2026-04-15',
    endDate: '2026-05-06',
    status: '进行中',
    summary: '完成打板确认、上架沟通和个人买家预售转化。',
  },
  {
    id: 'goal-006',
    customerId: 'K2604211152018593',
    title: '周度复购金额目标',
    owner: '陈敏',
    startDate: '2026-04-20',
    endDate: '2026-05-10',
    status: '已完成',
    targetAmount: 8000,
    currentAmount: 8200,
    summary: '聚焦小批量复购订单和高频触达，完成周度金额拉升。',
  },
];

const DEFAULT_TASKS: TaskRecord[] = [
  {
    id: 'task-001',
    goalId: 'goal-001',
    customerId: 'K2604100347139123',
    title: '推送新品首发资料包',
    assignee: '陈敏',
    dueDate: '2026-04-25',
    status: '进行中',
    priority: '高',
    latestProgressAt: '2026-04-22 10:20:00',
    description: '整理新品清单、卖点、价格带和陈列建议，完成首轮触达。',
  },
  {
    id: 'task-002',
    goalId: 'goal-001',
    customerId: 'K2604100347139123',
    title: '跟进首发订单排期',
    assignee: '黄家颖',
    dueDate: '2026-04-26',
    status: '进行中',
    priority: '中',
    latestProgressAt: '2026-04-22 15:00:00',
    description: '确认首发订单包装、发货窗口和客户确认节点。',
  },
  {
    id: 'task-003',
    goalId: 'goal-002',
    customerId: 'K2604100347139123',
    title: '预售礼盒打板确认',
    assignee: '陈敏',
    dueDate: '2026-04-24',
    status: '有风险',
    priority: '高',
    latestProgressAt: '2026-04-23 09:15:00',
    description: '盯打板回图、确认材质和尺寸，再推进客户确认。',
  },
  {
    id: 'task-004',
    goalId: 'goal-002',
    customerId: 'K2604100347139123',
    title: '确认预售上架节点',
    assignee: '黄家颖',
    dueDate: '2026-05-03',
    status: '未开始',
    priority: '中',
    latestProgressAt: '',
    description: '和客户确认活动档期、文案和最终上架节奏。',
  },
  {
    id: 'task-011',
    goalId: 'goal-007',
    customerId: 'K2604100347139123',
    title: '确认母亲节赠品打样时间',
    assignee: '黄家颖',
    dueDate: '2026-04-24',
    status: '有风险',
    priority: '高',
    latestProgressAt: '2026-04-23 11:20:00',
    description: '赠品打样回样慢于预期，需要准备备选供应商。',
  },
  {
    id: 'task-012',
    goalId: 'goal-007',
    customerId: 'K2604100347139123',
    title: '补齐母亲节档期备货清单',
    assignee: '陈敏',
    dueDate: '2026-04-26',
    status: '进行中',
    priority: '中',
    latestProgressAt: '2026-04-22 19:10:00',
    description: '核对预售主推款、赠品和补货数量。',
  },
  {
    id: 'task-013',
    goalId: 'goal-008',
    customerId: 'K2604100347139123',
    title: '完成老客补货复盘',
    assignee: '陈敏',
    dueDate: '2026-04-18',
    status: '已完成',
    priority: '低',
    latestProgressAt: '2026-04-18 16:40:00',
    description: '整理老客补货节奏、商品偏好和下轮推荐组合。',
  },
  {
    id: 'task-014',
    goalId: 'goal-008',
    customerId: 'K2604100347139123',
    title: '老客加购组合二次触达',
    assignee: '黄家颖',
    dueDate: '2026-04-17',
    status: '已完成',
    priority: '中',
    latestProgressAt: '2026-04-17 18:20:00',
    description: '针对高频老客补发组合推荐，带动加购和补货订单转化。',
  },
  {
    id: 'task-005',
    goalId: 'goal-003',
    customerId: 'K2604210349432034',
    title: 'A产品复购订单催单',
    assignee: '阿塔咪',
    dueDate: '2026-04-27',
    status: '进行中',
    priority: '高',
    latestProgressAt: '2026-04-22 11:40:00',
    description: '围绕A产品组合做复购节奏推进，锁定补货窗口。',
  },
  {
    id: 'task-006',
    goalId: 'goal-003',
    customerId: 'K2604210349432034',
    title: '输出组合陈列建议',
    assignee: '陈敏',
    dueDate: '2026-04-29',
    status: '已完成',
    priority: '中',
    latestProgressAt: '2026-04-21 16:35:00',
    description: '提供组合售卖建议和配套陈列图。',
  },
  {
    id: 'task-007',
    goalId: 'goal-004',
    customerId: 'K2604210349432034',
    title: '新品B样品寄送',
    assignee: '陈敏',
    dueDate: '2026-04-24',
    status: '进行中',
    priority: '高',
    latestProgressAt: '2026-04-23 08:30:00',
    description: '发送样品和首单报价，推动客户确认新品B。',
  },
  {
    id: 'task-008',
    goalId: 'goal-005',
    customerId: 'K2604211152018593',
    title: '跟进预售样板进度',
    assignee: '陈敏',
    dueDate: '2026-04-25',
    status: '进行中',
    priority: '高',
    latestProgressAt: '2026-04-22 18:00:00',
    description: '跟催样板确认时间并同步发货承诺。',
  },
  {
    id: 'task-009',
    goalId: 'goal-005',
    customerId: 'K2604211152018593',
    title: '确认预售转化订单',
    assignee: '陈敏',
    dueDate: '2026-04-23',
    status: '有风险',
    priority: '中',
    latestProgressAt: '2026-04-23 10:10:00',
    description: '客户还在比较价格方案，需要再次催确认。',
  },
  {
    id: 'task-010',
    goalId: 'goal-006',
    customerId: 'K2604211152018593',
    title: '完成本周复购复盘',
    assignee: '陈敏',
    dueDate: '2026-04-22',
    status: '已完成',
    priority: '低',
    latestProgressAt: '2026-04-22 20:30:00',
    description: '整理复购原因和下周跟进建议。',
  },
];

const DEFAULT_PROGRESS_LOGS: ProgressLog[] = [
  {
    id: 'log-001',
    taskId: 'task-001',
    customerId: 'K2604100347139123',
    submittedBy: '陈敏',
    submittedAt: '2026-04-21 16:10:00',
    progressPercent: 45,
    content: '首轮资料包已发送，客户希望增加终端陈列图片和搭配建议。',
    status: '进行中',
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
  },
  {
    id: 'log-004',
    taskId: 'task-003',
    customerId: 'K2604100347139123',
    submittedBy: '陈敏',
    submittedAt: '2026-04-23 09:15:00',
    progressPercent: 50,
    content: '打板厂回图比预期晚一天，客户要求重新确认材质厚度。',
    status: '有风险',
  },
  {
    id: 'log-011',
    taskId: 'task-011',
    customerId: 'K2604100347139123',
    submittedBy: '黄家颖',
    submittedAt: '2026-04-23 11:20:00',
    progressPercent: 40,
    content: '赠品打样确认仍慢于预期，明天下午前需确认备选方案。',
    status: '有风险',
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
  },
  {
    id: 'log-013',
    taskId: 'task-013',
    customerId: 'K2604100347139123',
    submittedBy: '陈敏',
    submittedAt: '2026-04-18 16:40:00',
    progressPercent: 100,
    content: '老客补货复盘完成，已输出下轮推荐组合。',
    status: '已完成',
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
  },
  {
    id: 'log-009',
    taskId: 'task-009',
    customerId: 'K2604211152018593',
    submittedBy: '陈敏',
    submittedAt: '2026-04-23 10:10:00',
    progressPercent: 35,
    content: '客户还在比较价格方案，今天需要再次催确认。',
    status: '有风险',
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
  },
];

const DEFAULT_ORDERS: OrderRecord[] = [
  {
    id: 'ORD20260421001',
    customerId: 'K2604100347139123',
    customerName: '胡******户',
    orderTime: '2026-04-21 11:20:00',
    createdBy: '陈敏',
    productName: '新品首发套组',
    orderAmount: 12600,
    orderStatus: '待发货',
  },
  {
    id: 'ORD20260422002',
    customerId: 'K2604100347139123',
    customerName: '胡******户',
    orderTime: '2026-04-22 16:35:40',
    createdBy: '黄家颖',
    productName: '老客加购组合',
    orderAmount: 9800,
    orderStatus: '待出库',
  },
  {
    id: 'ORD20260423003',
    customerId: 'K2604100347139123',
    customerName: '胡******户',
    orderTime: '2026-04-23 14:40:00',
    createdBy: '陈敏',
    productName: '母亲节预售礼包',
    orderAmount: 8400,
    orderStatus: '待确认',
  },
  {
    id: 'ORD20260421004',
    customerId: 'K2604210349432034',
    customerName: '谭****息',
    orderTime: '2026-04-21 10:12:00',
    createdBy: '阿塔咪',
    productName: 'A产品基础款',
    orderAmount: 5600,
    orderStatus: '待打包',
  },
  {
    id: 'ORD20260422005',
    customerId: 'K2604210349432034',
    customerName: '谭****息',
    orderTime: '2026-04-22 15:50:10',
    createdBy: '陈敏',
    productName: 'A产品组合补货',
    orderAmount: 7200,
    orderStatus: '待发货',
  },
  {
    id: 'ORD20260423006',
    customerId: 'K2604210349432034',
    customerName: '谭****息',
    orderTime: '2026-04-23 17:05:00',
    createdBy: '陈敏',
    productName: '新品B样品包',
    orderAmount: 2800,
    orderStatus: '已寄样',
  },
  {
    id: 'ORD20260421007',
    customerId: 'K2604211152018593',
    customerName: '谭*******息',
    orderTime: '2026-04-21 20:10:00',
    createdBy: '陈敏',
    productName: '周度复购小单',
    orderAmount: 2600,
    orderStatus: '已完成',
  },
  {
    id: 'ORD20260422008',
    customerId: 'K2604211152018593',
    customerName: '谭*******息',
    orderTime: '2026-04-22 18:55:00',
    createdBy: '陈敏',
    productName: '预售样板确认单',
    orderAmount: 3200,
    orderStatus: '待确认',
  },
  {
    id: 'ORD20260423009',
    customerId: 'K2604211152018593',
    customerName: '谭*******息',
    orderTime: '2026-04-23 19:30:00',
    createdBy: '陈敏',
    productName: '高频复购补单',
    orderAmount: 2400,
    orderStatus: '待发货',
  },
];

function getInitialQueryState(): { view: ViewMode; owner: string } {
  if (typeof window === 'undefined') {
    return { view: 'leader', owner: DEFAULT_OWNER };
  }
  const search = new URLSearchParams(window.location.search);
  const view = search.get('view') === 'sales' ? 'sales' : 'leader';
  const owner = search.get('owner') || DEFAULT_OWNER;
  return { view, owner };
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toTimestamp(value: string): number {
  if (!value || value === '-') {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatCurrency(value: number): string {
  return `¥${Math.round(value).toLocaleString('zh-CN')}`;
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatDate(value: string): string {
  return value && value !== '-' ? value.slice(0, 10) : '-';
}

function formatDateTime(value: string): string {
  return value && value !== '-' ? value.slice(5, 16) : '-';
}

function dayDiff(value: string): number {
  if (!value || value === '-') {
    return 999;
  }
  const today = new Date(TODAY);
  const target = new Date(value.slice(0, 10));
  return Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}

function buildNextFollowUp(lastFollowAt: string, importanceLevel: ImportanceLevel): string {
  if (!lastFollowAt || lastFollowAt === '-') {
    return TODAY;
  }
  const base = new Date(lastFollowAt);
  const offset = importanceLevel === 'A' ? 2 : importanceLevel === 'B' ? 3 : 4;
  base.setDate(base.getDate() + offset);
  return `${base.toISOString().slice(0, 10)} 18:00:00`;
}

function getStatusClass(status: string): string {
  if (status === '有风险') {
    return 'is-risk';
  }
  if (status === '已完成') {
    return 'is-done';
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
  return 'is-mid';
}

function getDashboardGoalSummary(goal: GoalRecord, tasks: TaskRecord[]): { headline: string; progressText: string; percent: number } {
  const scopedTasks = tasks.filter((item) => item.goalId === goal.id);
  const completedCount = scopedTasks.filter((item) => item.status === '已完成').length;

  if (goal.targetAmount) {
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

function getTaskLatestLog(logs: ProgressLog[], taskId: string): ProgressLog | undefined {
  return logs
    .filter((item) => item.taskId === taskId)
    .sort((left, right) => toTimestamp(right.submittedAt) - toTimestamp(left.submittedAt))[0];
}

function isTaskOverdue(task: TaskRecord): boolean {
  return task.status !== '已完成' && toTimestamp(task.dueDate) < toTimestamp(TODAY);
}

function createDefaultDashboardTaskForm(assignee: string): DashboardTaskFormState {
  return {
    title: '',
    assignee,
    dueDate: '2026-04-28',
    status: '未开始',
    priority: '中',
    description: '',
  };
}

function createDefaultDashboardProgressForm(
  task: TaskRecord | undefined,
  owner: string,
  latestLog?: ProgressLog
): DashboardProgressFormState {
  return {
    submittedBy: task?.assignee || owner,
    progressPercent: latestLog
      ? String(latestLog.progressPercent)
      : task?.status === '已完成'
        ? '100'
        : task?.status === '未开始'
          ? '10'
          : '60',
    status: task?.status && task.status !== '未开始' ? task.status : '进行中',
    content: '',
  };
}

function createPrototypeDateTime(seed: number): string {
  const hour = 10 + (seed % 8);
  const minute = (seed * 7) % 60;
  return `${TODAY} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

function deriveImportanceLevel(tags: string[], annualAmount: number): ImportanceLevel {
  const tagText = tags.join(' ');
  if (tagText.includes('重点') || tagText.includes('高潜') || annualAmount >= 30000) {
    return 'A';
  }
  if (tagText.includes('观察') || annualAmount < 10000) {
    return 'C';
  }
  return 'B';
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[、,，]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function toCustomerRecord(raw: Record<string, unknown>): CustomerRecord {
  const tags = normalizeTags(raw.tags);
  const annualAmount = parseNumber(raw.annual_amount ?? raw.annualAmount);
  const importanceLevel =
    (raw.importance_level as ImportanceLevel) ||
    (raw.importanceLevel as ImportanceLevel) ||
    deriveImportanceLevel(tags, annualAmount);
  const lastFollowAt = String(raw.last_follow_at ?? raw.lastFollowAt ?? '-');
  return {
    id: String(raw.id || ''),
    name: String(raw.name ?? raw.display_name ?? ''),
    owner: String(raw.owner || '-'),
    followUpBy: String(raw.follow_up_by ?? raw.followUpBy ?? '-'),
    customerType: String(raw.customer_type ?? raw.customerType ?? ''),
    annualAmount,
    region: String(raw.region || ''),
    tags,
    createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
    lastFollowAt,
    lastOrderAt: String(raw.last_order_at ?? raw.lastOrderAt ?? '-'),
    importanceLevel,
    nextFollowUpAt: String(raw.next_follow_up_at ?? raw.nextFollowUpAt ?? buildNextFollowUp(lastFollowAt, importanceLevel)),
  };
}

function toGoalRecord(raw: Record<string, unknown>): GoalRecord {
  return {
    id: String(raw.id || ''),
    customerId: String(raw.customer_id ?? raw.customerId ?? ''),
    title: String(raw.title || ''),
    owner: String(raw.owner || ''),
    status: String(raw.status || '进行中') as GoalStatus,
    targetAmount: parseNumber(raw.target_amount ?? raw.targetAmount) || undefined,
    currentAmount: parseNumber(raw.current_amount ?? raw.currentAmount) || undefined,
    startDate: String(raw.start_date ?? raw.startDate ?? ''),
    endDate: String(raw.end_date ?? raw.endDate ?? ''),
    summary: String(raw.summary || ''),
  };
}

function toTaskRecord(raw: Record<string, unknown>): TaskRecord {
  return {
    id: String(raw.id || ''),
    goalId: String(raw.goal_id ?? raw.goalId ?? ''),
    customerId: String(raw.customer_id ?? raw.customerId ?? ''),
    title: String(raw.title || ''),
    assignee: String(raw.assignee || ''),
    dueDate: String(raw.due_date ?? raw.dueDate ?? ''),
    status: String(raw.status || '未开始') as TaskStatus,
    priority: String(raw.priority || '中') as TaskPriority,
    latestProgressAt: String(raw.latest_progress_at ?? raw.latestProgressAt ?? ''),
    description: String(raw.description || ''),
  };
}

function toProgressLog(raw: Record<string, unknown>): ProgressLog {
  return {
    id: String(raw.id || ''),
    taskId: String(raw.task_id ?? raw.taskId ?? ''),
    customerId: String(raw.customer_id ?? raw.customerId ?? ''),
    submittedBy: String(raw.submitted_by ?? raw.submittedBy ?? ''),
    submittedAt: String(raw.submitted_at ?? raw.submittedAt ?? ''),
    progressPercent: parseNumber(raw.progress_percent ?? raw.progressPercent),
    content: String(raw.content || ''),
    status: String(raw.status || '进行中') as TaskStatus,
  };
}

function toOrderRecord(raw: Record<string, unknown>): OrderRecord {
  return {
    id: String(raw.id || ''),
    customerId: String(raw.customer_id ?? raw.customerId ?? raw['客户编号'] ?? ''),
    customerName: String(raw.customer_name ?? raw.customerName ?? raw['客户名称'] ?? ''),
    orderTime: String(raw.order_time ?? raw.orderTime ?? raw['下单时间'] ?? ''),
    createdBy: String(raw.created_by ?? raw.createdBy ?? raw['创建人'] ?? raw['下单人'] ?? ''),
    productName: String(raw.product_name ?? raw.productName ?? raw['商品名称'] ?? ''),
    orderAmount: parseNumber(raw.order_amount ?? raw.orderAmount ?? raw['订单总额(元)']),
    orderStatus: String(raw.order_status ?? raw.orderStatus ?? raw['订单状态'] ?? ''),
  };
}

function buildLinePath(values: number[], width: number, height: number): string {
  const safeValues = values.length > 0 ? values : [0];
  const max = Math.max(...safeValues, 1);
  return safeValues
    .map((value, index) => {
      const x = safeValues.length === 1 ? width / 2 : (width / (safeValues.length - 1)) * index;
      const y = height - (value / max) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function uniqueNames(values: string[]): string[] {
  return Array.from(new Set(values.filter((item) => item && item !== '-')));
}

function matchesSalesperson(customer: CustomerRecord, owner: string): boolean {
  return customer.owner === owner || customer.followUpBy === owner;
}

function getScopeData(
  view: ViewMode,
  owner: string,
  customers: CustomerRecord[],
  goals: GoalRecord[],
  tasks: TaskRecord[],
  logs: ProgressLog[],
  orders: OrderRecord[]
) {
  const scopedCustomers = view === 'leader' ? customers : customers.filter((item) => matchesSalesperson(item, owner));
  const customerIds = new Set(scopedCustomers.map((item) => item.id));
  const scopedGoals = goals.filter((item) => customerIds.has(item.customerId) || (view === 'sales' && item.owner === owner));
  const scopedTasks = tasks.filter((item) => customerIds.has(item.customerId) || (view === 'sales' && item.assignee === owner));
  const taskIds = new Set(scopedTasks.map((item) => item.id));
  const scopedLogs = logs.filter((item) => taskIds.has(item.taskId) || customerIds.has(item.customerId));
  const scopedOrders = orders.filter((item) => customerIds.has(item.customerId));
  return { scopedCustomers, scopedGoals, scopedTasks, scopedLogs, scopedOrders };
}

function buildCustomerRows(
  customers: CustomerRecord[],
  goals: GoalRecord[],
  tasks: TaskRecord[],
  logs: ProgressLog[]
): DashboardCustomerRow[] {
  return customers
    .map((customer) => {
      const customerGoals = goals.filter((item) => item.customerId === customer.id);
      const customerTasks = tasks.filter((item) => item.customerId === customer.id);
      const customerLogs = logs.filter((item) => item.customerId === customer.id);
      const openTasks = customerTasks.filter((item) => item.status !== '已完成');
      const riskGoal = customerGoals.some((item) => item.status === '有风险');
      const riskTask = customerTasks.some((item) => item.status === '有风险');
      const overdueTaskCount = customerTasks.filter(
        (item) => item.status !== '已完成' && item.dueDate && dayDiff(item.dueDate) > 0
      ).length;
      const staleFollow = dayDiff(customer.lastFollowAt) >= (customer.importanceLevel === 'A' ? 3 : 5);
      const attentionStatus = !customer.followUpBy || customer.followUpBy === '-'
        ? '无人跟进'
        : riskGoal || riskTask || overdueTaskCount > 0
          ? '高风险'
          : staleFollow
            ? '需补跟进'
            : '正常推进';
      const riskCount = customerGoals.filter((item) => item.status === '有风险').length;
      const activeCount = customerGoals.filter((item) => item.status === '进行中').length;
      const hasOngoingGoals = riskCount > 0 || activeCount > 0;
      const lastFollowAt =
        [customer.lastFollowAt, ...customerLogs.map((item) => item.submittedAt)]
          .sort((left, right) => toTimestamp(right) - toTimestamp(left))[0] || customer.lastFollowAt;

      return {
        customerId: customer.id,
        customerName: customer.name,
        owner: customer.owner,
        followUpBy: customer.followUpBy,
        importanceLevel: customer.importanceLevel,
        lastFollowAt,
        lastOrderAt: customer.lastOrderAt,
        annualAmount: customer.annualAmount,
        riskGoalCount: riskCount,
        inProgressGoalCount: activeCount,
        openTaskCount: hasOngoingGoals ? openTasks.length : 0,
        highPriorityOpenTaskCount: hasOngoingGoals ? openTasks.filter((item) => item.priority === '高').length : 0,
        riskTaskCount: customerTasks.filter((item) => item.status === '有风险').length,
        inProgressTaskCount: customerTasks.filter((item) => item.status === '进行中').length,
        attentionStatus,
      };
    })
    .sort((left, right) => {
      const importanceScore = { A: 3, B: 2, C: 1 };
      return (
        importanceScore[right.importanceLevel] - importanceScore[left.importanceLevel] ||
        toTimestamp(right.lastFollowAt) - toTimestamp(left.lastFollowAt)
      );
    });
}

function buildAlerts(
  view: ViewMode,
  owner: string,
  customers: CustomerRecord[],
  goals: GoalRecord[],
  tasks: TaskRecord[],
  logs: ProgressLog[]
): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  customers.forEach((customer) => {
    const customerGoals = goals.filter((item) => item.customerId === customer.id);
    const customerTasks = tasks.filter((item) => item.customerId === customer.id);
    const customerLogs = logs.filter((item) => item.customerId === customer.id);
    const staleFollowDays = dayDiff(customer.lastFollowAt);
    const overdueTasks = customerTasks.filter((item) => item.status !== '已完成' && dayDiff(item.dueDate) > 0);

    if (!customer.followUpBy || customer.followUpBy === '-') {
      alerts.push({
        id: `alert-unassigned-${customer.id}`,
        view,
        owner,
        severity: '高',
        alertType: '无人跟进客户',
        customerId: customer.id,
        customerName: customer.name,
        reason: '客户当前没有明确跟进人，容易出现经营断层。',
        dueAt: TODAY,
        suggestedAction: '立即明确归属人与跟进人，补齐负责人。 ',
      });
    }

    if (customer.importanceLevel === 'A' && staleFollowDays >= 3) {
      alerts.push({
        id: `alert-key-stale-${customer.id}`,
        view,
        owner,
        severity: '高',
        alertType: '重点客户失联',
        customerId: customer.id,
        customerName: customer.name,
        reason: `重点客户已 ${staleFollowDays} 天未形成有效跟进。`,
        dueAt: customer.nextFollowUpAt || TODAY,
        suggestedAction: '今天完成一次有结果的触达，并同步领导知晓当前风险。',
      });
    }

    if (customerGoals.some((item) => item.status === '有风险')) {
      alerts.push({
        id: `alert-goal-risk-${customer.id}`,
        view,
        owner,
        severity: '高',
        alertType: '目标有风险',
        customerId: customer.id,
        customerName: customer.name,
        reason: '当前客户存在风险目标，目标节点需要重新校准。',
        dueAt: customerGoals.find((item) => item.status === '有风险')?.endDate || TODAY,
        suggestedAction: '优先检查拖累该目标的任务和资源瓶颈。',
      });
    }

    if (overdueTasks.length > 0) {
      alerts.push({
        id: `alert-task-overdue-${customer.id}`,
        view,
        owner,
        severity: overdueTasks.some((item) => item.priority === '高') ? '高' : '中',
        alertType: '任务逾期',
        customerId: customer.id,
        customerName: customer.name,
        reason: `当前有 ${overdueTasks.length} 个未完成任务已逾期。`,
        dueAt: overdueTasks[0].dueDate,
        suggestedAction: '今天内确认责任人与处理时点，避免继续拖延。',
      });
    }

    const lastLogAt = customerLogs.sort((left, right) => toTimestamp(right.submittedAt) - toTimestamp(left.submittedAt))[0]?.submittedAt;
    if (lastLogAt && dayDiff(lastLogAt) >= 2 && customerGoals.some((item) => item.status === '进行中')) {
      alerts.push({
        id: `alert-progress-stale-${customer.id}`,
        view,
        owner,
        severity: '中',
        alertType: '长期无进展',
        customerId: customer.id,
        customerName: customer.name,
        reason: '目标仍在推进，但最近两天没有新的进展提交。',
        dueAt: TODAY,
        suggestedAction: '补一条最新进展，并确认下一步动作是否明确。',
      });
    }
  });

  const severityRank = { 高: 3, 中: 2, 低: 1 };
  return alerts.sort((left, right) => {
    return (
      severityRank[right.severity] - severityRank[left.severity] ||
      toTimestamp(left.dueAt) - toTimestamp(right.dueAt)
    );
  });
}

function buildSummary(
  view: ViewMode,
  owner: string,
  customers: CustomerRecord[],
  customerRows: DashboardCustomerRow[],
  goals: GoalRecord[],
  tasks: TaskRecord[],
  alerts: DashboardAlert[]
): DashboardSummary {
  const targetAmount = goals.reduce((sum, item) => sum + (item.targetAmount || 0), 0);
  const currentAmount = goals.reduce((sum, item) => sum + (item.currentAmount || 0), 0);
  const dueTodayCount =
    customers.filter((item) => item.nextFollowUpAt && dayDiff(item.nextFollowUpAt) >= 0).length +
    tasks.filter((item) => item.status !== '已完成' && dayDiff(item.dueDate) === 0).length;
  const overdueTaskCount = tasks.filter((item) => item.status !== '已完成' && dayDiff(item.dueDate) > 0).length;
  return {
    view,
    owner,
    targetAmount,
    currentAmount,
    progressRate: targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0,
    customerCount: customers.length,
    activeCustomerCount: customerRows.filter((item) => dayDiff(item.lastFollowAt) <= 7).length,
    keyCustomerCount: customerRows.filter((item) => item.importanceLevel === 'A').length,
    riskCustomerCount: customerRows.filter((item) => item.attentionStatus === '高风险' || item.attentionStatus === '无人跟进').length,
    dueTodayCount,
    overdueTaskCount,
    needLeaderAttentionCount: alerts.filter((item) => item.severity === '高').length,
  };
}

function buildSalespersonRows(
  ownerOptions: string[],
  customers: CustomerRecord[],
  goals: GoalRecord[],
  tasks: TaskRecord[],
  logs: ProgressLog[]
): SalespersonRow[] {
  return ownerOptions
    .map((owner) => {
      const scopedCustomers = customers.filter((item) => matchesSalesperson(item, owner));
      const customerIds = new Set(scopedCustomers.map((item) => item.id));
      const scopedGoals = goals.filter((item) => customerIds.has(item.customerId) || item.owner === owner);
      const scopedTasks = tasks.filter((item) => customerIds.has(item.customerId) || item.assignee === owner);
      const relatedLogTimes = logs
        .filter((item) => customerIds.has(item.customerId) || item.submittedBy === owner)
        .map((item) => item.submittedAt);
      const lastFollowAt = [...scopedCustomers.map((item) => item.lastFollowAt), ...relatedLogTimes]
        .sort((left, right) => toTimestamp(right) - toTimestamp(left))[0] || '-';
      const targetAmount = scopedGoals.reduce((sum, item) => sum + (item.targetAmount || 0), 0);
      const currentAmount = scopedGoals.reduce((sum, item) => sum + (item.currentAmount || 0), 0);

      return {
        salespersonName: owner,
        managedCustomerCount: scopedCustomers.length,
        keyCustomerCount: scopedCustomers.filter((item) => item.importanceLevel === 'A').length,
        targetAmount,
        currentAmount,
        progressRate: targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0,
        riskGoalCount: scopedGoals.filter((item) => item.status === '有风险').length,
        overdueTaskCount: scopedTasks.filter((item) => item.status !== '已完成' && dayDiff(item.dueDate) > 0).length,
        lastFollowAt,
      };
    })
    .sort((left, right) => {
      return right.progressRate - left.progressRate || right.managedCustomerCount - left.managedCustomerCount;
    });
}

function buildTrendBuckets(logs: ProgressLog[], orders: OrderRecord[]) {
  const labels = ['04-18', '04-19', '04-20', '04-21', '04-22', '04-23', '04-24'];
  const followValues = labels.map((label) => logs.filter((item) => item.submittedAt.includes(label)).length);
  const orderValues = labels.map((label) => orders.filter((item) => item.orderTime.includes(label)).length);
  return { labels, followValues, orderValues };
}

function renderEmpty(message: string) {
  return <div className="crm-dashboard-empty-state">{message}</div>;
}

const Component = forwardRef<AxureHandle, AxureProps>(function CrmDashboard(innerProps, ref) {
  const dataSource = innerProps?.data || {};
  const configSource = innerProps?.config || {};
  const onEventHandler = typeof innerProps?.onEvent === 'function' ? innerProps.onEvent : () => undefined;

  const operatorName =
    typeof configSource.operator_name === 'string' && configSource.operator_name
      ? configSource.operator_name
      : '阿塔咪';

  const initialQuery = getInitialQueryState();
  const initialCustomers = Array.isArray(dataSource.customers)
    ? dataSource.customers.map((item) => toCustomerRecord(item as Record<string, unknown>))
    : DEFAULT_CUSTOMERS;
  const initialGoals = Array.isArray(dataSource.goal_targets)
    ? dataSource.goal_targets.map((item) => toGoalRecord(item as Record<string, unknown>))
    : DEFAULT_GOALS;
  const initialTasks = Array.isArray(dataSource.task_items)
    ? dataSource.task_items.map((item) => toTaskRecord(item as Record<string, unknown>))
    : DEFAULT_TASKS;
  const initialLogs = Array.isArray(dataSource.task_progress_logs)
    ? dataSource.task_progress_logs.map((item) => toProgressLog(item as Record<string, unknown>))
    : DEFAULT_PROGRESS_LOGS;
  const initialOrders = Array.isArray(dataSource.customer_orders)
    ? dataSource.customer_orders.map((item) => toOrderRecord(item as Record<string, unknown>))
    : DEFAULT_ORDERS;

  const ownerOptions = uniqueNames([
    ...initialCustomers.map((item) => item.owner),
    ...initialCustomers.map((item) => item.followUpBy),
    ...initialGoals.map((item) => item.owner),
    ...initialTasks.map((item) => item.assignee),
  ]);

  const [currentView, setCurrentView] = useState<ViewMode>(initialQuery.view);
  const [selectedOwner, setSelectedOwner] = useState(ownerOptions.includes(initialQuery.owner) ? initialQuery.owner : DEFAULT_OWNER);
  const [chartHoverIndex, setChartHoverIndex] = useState<number | null>(null);
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<CustomerFilterKey>('all');
  const [salesGoalFilter, setSalesGoalFilter] = useState<DashboardGoalFilter>('全部');
  const [selectedSalesGoalId, setSelectedSalesGoalId] = useState('');
  const [selectedSalesTaskId, setSelectedSalesTaskId] = useState('');
  const [tasksData, setTasksData] = useState<TaskRecord[]>(initialTasks);
  const [logsData, setLogsData] = useState<ProgressLog[]>(initialLogs);
  const [isSalesTaskFormOpen, setIsSalesTaskFormOpen] = useState(false);
  const [salesTaskForm, setSalesTaskForm] = useState<DashboardTaskFormState>(createDefaultDashboardTaskForm(DEFAULT_OWNER));
  const [isSalesProgressModalOpen, setIsSalesProgressModalOpen] = useState(false);
  const [salesProgressForm, setSalesProgressForm] = useState<DashboardProgressFormState>(
    createDefaultDashboardProgressForm(undefined, DEFAULT_OWNER)
  );

  const { scopedCustomers, scopedGoals, scopedTasks, scopedLogs, scopedOrders } = getScopeData(
    currentView,
    selectedOwner,
    initialCustomers,
    initialGoals,
    tasksData,
    logsData,
    initialOrders
  );

  const customerRows = buildCustomerRows(scopedCustomers, scopedGoals, scopedTasks, scopedLogs);
  const alerts = buildAlerts(currentView, selectedOwner, scopedCustomers, scopedGoals, scopedTasks, scopedLogs);
  const summary = buildSummary(currentView, selectedOwner, scopedCustomers, customerRows, scopedGoals, scopedTasks, alerts);
  const salespersonRows = buildSalespersonRows(ownerOptions, initialCustomers, initialGoals, tasksData, logsData);
  const trendBuckets = buildTrendBuckets(scopedLogs, scopedOrders);

  const todayFollowCustomers = customerRows.filter((item) => dayDiff(item.lastFollowAt) >= 2 || dayDiff(scopedCustomers.find((customer) => customer.id === item.customerId)?.nextFollowUpAt || '') >= 0);
  const overdueTasks = scopedTasks.filter((item) => item.status !== '已完成' && dayDiff(item.dueDate) > 0);
  const dueSoonTasks = scopedTasks.filter((item) => item.status !== '已完成' && dayDiff(item.dueDate) >= -1 && dayDiff(item.dueDate) <= 1);
  const recentProgressCustomers = uniqueNames(
    scopedLogs
      .filter((item) => dayDiff(item.submittedAt) <= 2)
      .map((item) => customerRows.find((row) => row.customerId === item.customerId)?.customerName || '')
  );
  const recentOrderCustomers = uniqueNames(
    scopedOrders
      .filter((item) => dayDiff(item.orderTime) <= 2)
      .map((item) => item.customerName)
  );
  const focusCustomers = customerRows.filter((item) => item.importanceLevel === 'A');
  const pushCustomers = customerRows.filter((item) => item.inProgressGoalCount > 0 || item.riskGoalCount > 0);
  const idleCustomers = customerRows.filter((item) => item.openTaskCount === 0);
  const priorityCustomers = customerRows.filter((item) => item.highPriorityOpenTaskCount > 0);
  const customerNameMap = new Map(scopedCustomers.map((item) => [item.id, item.name]));
  const filteredCustomerRows = customerRows.filter((item) => {
    if (selectedCustomerFilter === 'focus') {
      return item.importanceLevel === 'A';
    }
    if (selectedCustomerFilter === 'progressing') {
      return item.inProgressGoalCount > 0 || item.riskGoalCount > 0;
    }
    if (selectedCustomerFilter === 'idle') {
      return item.openTaskCount === 0;
    }
    if (selectedCustomerFilter === 'priority') {
      return item.highPriorityOpenTaskCount > 0;
    }
    return true;
  });
  const customerFilterCards = [
    { key: 'focus' as const, label: 'A级客户', count: focusCustomers.length },
    { key: 'progressing' as const, label: '正在推进', count: pushCustomers.length },
    { key: 'idle' as const, label: '待补跟进', count: idleCustomers.length },
    { key: 'priority' as const, label: '高优先未完结任务', count: priorityCustomers.length },
  ];
  const sortedSalesGoals = useMemo(
    () =>
      scopedGoals
        .slice()
        .sort((left, right) => {
          const leftRate = left.targetAmount ? (left.currentAmount || 0) / left.targetAmount : 0;
          const rightRate = right.targetAmount ? (right.currentAmount || 0) / right.targetAmount : 0;
          return rightRate - leftRate || toTimestamp(left.endDate) - toTimestamp(right.endDate);
        }),
    [scopedGoals]
  );
  const salesGoalFilterCounts = useMemo<Record<DashboardGoalFilter, number>>(
    () =>
      sortedSalesGoals.reduce(
        (counts, goal) => {
          counts.全部 += 1;
          counts[goal.status] += 1;
          return counts;
        },
        { 全部: 0, 进行中: 0, 有风险: 0, 已完成: 0 }
      ),
    [sortedSalesGoals]
  );
  const filteredSalesGoals = useMemo(
    () => (salesGoalFilter === '全部' ? sortedSalesGoals : sortedSalesGoals.filter((item) => item.status === salesGoalFilter)),
    [salesGoalFilter, sortedSalesGoals]
  );
  const selectedSalesGoal = useMemo(
    () => filteredSalesGoals.find((item) => item.id === selectedSalesGoalId) || filteredSalesGoals[0],
    [filteredSalesGoals, selectedSalesGoalId]
  );
  const selectedSalesGoalTasks = useMemo(
    () => scopedTasks.filter((item) => item.goalId === selectedSalesGoal?.id),
    [scopedTasks, selectedSalesGoal?.id]
  );
  const selectedSalesTask = useMemo(
    () => selectedSalesGoalTasks.find((item) => item.id === selectedSalesTaskId),
    [selectedSalesGoalTasks, selectedSalesTaskId]
  );
  const selectedSalesTaskLogs = useMemo(
    () =>
      scopedLogs
        .filter((item) => item.taskId === selectedSalesTaskId)
        .sort((left, right) => toTimestamp(right.submittedAt) - toTimestamp(left.submittedAt)),
    [scopedLogs, selectedSalesTaskId]
  );
  const contributionRows = customerRows
    .slice()
    .sort((left, right) => right.annualAmount - left.annualAmount)
    .map((item) => ({
      label: item.customerName,
      value: item.annualAmount,
      ratio: summary.currentAmount > 0 ? Math.min(100, (item.annualAmount / customerRows.reduce((sum, row) => sum + row.annualAmount, 0)) * 100) : 0,
    }));
  const totalAnnualAmount = customerRows.reduce((sum, item) => sum + item.annualAmount, 0);
  const keyContribution = totalAnnualAmount > 0
    ? (customerRows.filter((item) => item.importanceLevel === 'A').reduce((sum, item) => sum + item.annualAmount, 0) / totalAnnualAmount) * 100
    : 0;
  const topOneConcentration = contributionRows[0] && totalAnnualAmount > 0 ? (contributionRows[0].value / totalAnnualAmount) * 100 : 0;
  const followCoverage = summary.customerCount > 0 ? (summary.activeCustomerCount / summary.customerCount) * 100 : 0;
  const riskExposure = summary.customerCount > 0 ? (summary.riskCustomerCount / summary.customerCount) * 100 : 0;

  useEffect(() => {
    const nextGoalId = selectedSalesGoal?.id || '';
    if (selectedSalesGoalId !== nextGoalId) {
      setSelectedSalesGoalId(nextGoalId);
    }
  }, [selectedSalesGoal?.id, selectedSalesGoalId]);

  useEffect(() => {
    if (selectedSalesTaskId && !selectedSalesGoalTasks.some((item) => item.id === selectedSalesTaskId)) {
      setSelectedSalesTaskId('');
    }
  }, [selectedSalesGoalTasks, selectedSalesTaskId]);

  useEffect(() => {
    if (!isSalesTaskFormOpen) {
      setSalesTaskForm(createDefaultDashboardTaskForm(selectedOwner));
    }
  }, [isSalesTaskFormOpen, selectedOwner]);

  useEffect(() => {
    if (!isSalesProgressModalOpen) {
      setSalesProgressForm(
        createDefaultDashboardProgressForm(selectedSalesTask, selectedOwner, selectedSalesTaskLogs[0])
      );
    }
  }, [isSalesProgressModalOpen, selectedOwner, selectedSalesTask, selectedSalesTaskLogs]);

  function emitEvent(name: string, payload?: Record<string, unknown>) {
    try {
      onEventHandler(name, payload ? JSON.stringify(payload) : undefined);
    } catch (error) {
      console.warn(`event ${name} failed`, error);
    }
  }

  function syncUrl(nextView: ViewMode, nextOwner: string) {
    if (typeof window === 'undefined') {
      return;
    }
    const search = new URLSearchParams(window.location.search);
    search.set('view', nextView);
    if (nextView === 'sales' && nextOwner) {
      search.set('owner', nextOwner);
    } else {
      search.delete('owner');
    }
    const query = search.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }

  function switchView(nextView: ViewMode, nextOwner = selectedOwner) {
    setCurrentView(nextView);
    if (nextOwner) {
      setSelectedOwner(nextOwner);
    }
    syncUrl(nextView, nextOwner);
    emitEvent('on_switch_view', {
      view: nextView,
      owner: nextOwner,
    });
  }

  function openSalesView(owner: string) {
    setSelectedOwner(owner);
    setCurrentView('sales');
    syncUrl('sales', owner);
    emitEvent('on_open_sales_view', { owner });
  }

  function changeOwner(owner: string) {
    setSelectedOwner(owner);
    syncUrl(currentView, owner);
    emitEvent('on_change_owner_filter', { owner, view: currentView });
  }

  function viewCustomer(customerId: string) {
    emitEvent('on_view_customer', {
      customer_id: customerId,
      view: currentView,
      owner: selectedOwner,
    });
    if (typeof window !== 'undefined') {
      window.location.href = `/prototypes/crm-customer-detail?id=${encodeURIComponent(customerId)}`;
    }
  }

  function selectSalesGoal(goalId: string) {
    setSelectedSalesGoalId(goalId);
    setSelectedSalesTaskId('');
  }

  function openSalesTask(taskId: string) {
    setSelectedSalesTaskId(taskId);
  }

  function closeSalesTaskDrawer() {
    setSelectedSalesTaskId('');
    setIsSalesProgressModalOpen(false);
  }

  function closeSalesTaskForm() {
    setIsSalesTaskFormOpen(false);
    setSalesTaskForm(createDefaultDashboardTaskForm(selectedOwner));
  }

  function openSalesProgressModal() {
    if (!selectedSalesTask) {
      return;
    }
    setSalesProgressForm(
      createDefaultDashboardProgressForm(selectedSalesTask, selectedOwner, selectedSalesTaskLogs[0])
    );
    setIsSalesProgressModalOpen(true);
  }

  function closeSalesProgressModal() {
    setIsSalesProgressModalOpen(false);
    setSalesProgressForm(
      createDefaultDashboardProgressForm(selectedSalesTask, selectedOwner, selectedSalesTaskLogs[0])
    );
  }

  function handleCreateSalesTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSalesGoal) {
      return;
    }

    const nextTask: TaskRecord = {
      id: `task-${Date.now()}`,
      goalId: selectedSalesGoal.id,
      customerId: selectedSalesGoal.customerId,
      title: salesTaskForm.title || '未命名任务',
      assignee: salesTaskForm.assignee || selectedOwner,
      dueDate: salesTaskForm.dueDate || TODAY,
      status: salesTaskForm.status,
      priority: salesTaskForm.priority,
      latestProgressAt: '',
      description: salesTaskForm.description || '新建任务待补充说明',
    };

    setTasksData((current) => [nextTask, ...current]);
    setSelectedSalesTaskId(nextTask.id);
    closeSalesTaskForm();
  }

  function handleSubmitSalesProgress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSalesTask) {
      return;
    }

    const submittedAt = createPrototypeDateTime(logsData.length + 1);
    const progressPercent = Math.max(0, Math.min(100, Math.round(parseNumber(salesProgressForm.progressPercent))));
    const submittedBy = salesProgressForm.submittedBy.trim() || selectedSalesTask.assignee || selectedOwner;
    const content = salesProgressForm.content.trim() || '已补充最新推进说明，待继续跟进。';
    const nextStatus = salesProgressForm.status;

    const nextLog: ProgressLog = {
      id: `log-${Date.now()}`,
      taskId: selectedSalesTask.id,
      customerId: selectedSalesTask.customerId,
      submittedBy,
      submittedAt,
      progressPercent,
      content,
      status: nextStatus,
    };

    setLogsData((current) => [nextLog, ...current]);
    setTasksData((current) =>
      current.map((task) =>
        task.id === selectedSalesTask.id
          ? {
              ...task,
              status: nextStatus,
              latestProgressAt: submittedAt,
            }
          : task
      )
    );
    setIsSalesProgressModalOpen(false);
  }

  useImperativeHandle(
    ref,
    () => ({
      getVar(name: string) {
        if (name === 'current_view') {
          return currentView;
        }
        if (name === 'current_owner') {
          return selectedOwner;
        }
        if (name === 'customer_count') {
          return summary.customerCount;
        }
        if (name === 'alert_count') {
          return alerts.length;
        }
        if (name === 'key_customer_count') {
          return summary.keyCustomerCount;
        }
        if (name === 'overdue_task_count') {
          return summary.overdueTaskCount;
        }
        return undefined;
      },
      fireAction(name: string, params?: string) {
        if (name === 'set_view') {
          switchView(params === 'sales' ? 'sales' : 'leader');
        }
        if (name === 'set_owner' && params) {
          changeOwner(params);
        }
      },
      eventList: EVENT_LIST,
      actionList: ACTION_LIST,
      varList: VAR_LIST,
      configList: CONFIG_LIST,
      dataList: DATA_LIST,
    }),
    [alerts.length, currentView, selectedOwner, summary.customerCount, summary.keyCustomerCount, summary.overdueTaskCount]
  );

  return (
    <div className="crm-dashboard-shell">
      <div className="crm-dashboard-logo">
        <div className="crm-dashboard-logo-mark" aria-hidden="true">
          C
        </div>
        <span className="crm-dashboard-logo-text">CLEARAL</span>
      </div>

      <header className="crm-dashboard-topbar">
        <div className="crm-dashboard-topbar-left">
          <button className="crm-dashboard-icon-button" type="button" aria-label="打开菜单">
            <Menu size={18} />
          </button>
          <div className="crm-dashboard-breadcrumb">
            <span>销售管理</span>
            <ChevronRight size={14} />
            <span>{currentView === 'leader' ? '领导驾驶舱' : '业务员客户汇总'}</span>
          </div>
        </div>
        <div className="crm-dashboard-topbar-right">
          <button className="crm-dashboard-icon-button" type="button" aria-label="搜索">
            <Search size={16} />
          </button>
          <span className="crm-dashboard-operator">{operatorName}</span>
          <div className="crm-dashboard-avatar" aria-hidden="true">
            {operatorName.slice(0, 1)}
          </div>
        </div>
      </header>

      <aside className="crm-dashboard-sidebar">
        <nav className="crm-dashboard-nav">
          {NAV_GROUPS.map((group) => (
            <div className="crm-dashboard-nav-group" key={group.label}>
              <button className="crm-dashboard-nav-parent" type="button">
                <span className="crm-dashboard-nav-parent-label">
                  {group.icon}
                  {group.label}
                </span>
                {group.items ? <ChevronDown size={14} /> : null}
              </button>
              {group.items ? (
                <div className="crm-dashboard-nav-children">
                  {group.items.map((item) => (
                    <button className={`crm-dashboard-nav-child${item.active ? ' is-active' : ''}`} key={item.label} type="button">
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

      <main className="crm-dashboard-main">
        <section className="crm-dashboard-tag-strip">
          {PAGE_TAGS.map((tag) => (
            <button
              className={`crm-dashboard-page-tag${tag === '客户驾驶舱' ? ' is-active' : ''}`}
              key={tag}
              type="button"
            >
              {tag}
            </button>
          ))}
        </section>

        <section className="crm-dashboard-page-head">
          <div>
            <h1>{currentView === 'leader' ? 'CRM 客户经营驾驶舱' : `${selectedOwner} 的客户经营盘`}</h1>
            {currentView === 'sales' && (
              <button
                className="crm-dashboard-back-button"
                type="button"
                onClick={() => switchView('leader')}
              >
                <ChevronLeft size={14} />
                返回
              </button>
            )}
          </div>

          <div className="crm-dashboard-header-metrics">
            <div className="crm-dashboard-header-metric-item">
              <div className="crm-dashboard-header-metric-icon">
                <Target size={16} />
              </div>
              <div className="crm-dashboard-header-metric-info">
                <span className="label">{currentView === 'leader' ? '团队目标金额' : '我的目标金额'}</span>
                <span className="value">{formatCurrency(summary.targetAmount)}</span>
              </div>
            </div>
            <div className="crm-dashboard-header-metric-divider" />
            <div className="crm-dashboard-header-metric-item">
              <div className="crm-dashboard-header-metric-icon is-success">
                <Activity size={16} />
              </div>
              <div className="crm-dashboard-header-metric-info">
                <span className="label">{currentView === 'leader' ? '当前已达成' : '当前已完成'}</span>
                <span className="value is-success">{formatCurrency(summary.currentAmount)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="crm-dashboard-layout">
          <div className="crm-dashboard-primary-column">
            <article className="crm-dashboard-panel">
              <div className="crm-dashboard-panel-header">
                <div>
                  <div className="crm-dashboard-panel-title">
                    <span className="crm-dashboard-panel-bar" />
                    <span>{currentView === 'leader' ? '目标与执行区' : '我的目标达成区'}</span>
                  </div>
                </div>
                {currentView === 'sales' ? (
                  <div className="crm-dashboard-goal-toolbar">
                    <div className="crm-dashboard-filter-group">
                      {DASHBOARD_GOAL_FILTER_OPTIONS.map((item) => (
                        <button
                          key={item}
                          className={`crm-dashboard-pill-button${salesGoalFilter === item ? ' is-active' : ''}`}
                          type="button"
                          onClick={() => setSalesGoalFilter(item)}
                        >
                          {`${item}（${salesGoalFilterCounts[item]}）`}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {currentView === 'leader' ? (
                <div className="crm-dashboard-table-card">
                  <div className="crm-dashboard-table-head">
                    <span>业务员</span>
                    <span>负责/跟进客户</span>
                    <span>A级客户</span>
                    <span>目标达成率</span>
                    <span>风险目标</span>
                    <span>逾期任务</span>
                    <span>最近跟进</span>
                    <span>操作</span>
                  </div>
                  {salespersonRows.length > 0 ? (
                    salespersonRows.map((row) => (
                      <div className="crm-dashboard-table-row" key={row.salespersonName}>
                        <div className="crm-dashboard-table-main">
                          <strong>{row.salespersonName}</strong>
                          <small>{formatCurrency(row.currentAmount)} / {formatCurrency(row.targetAmount)}</small>
                        </div>
                        <span>{row.managedCustomerCount}</span>
                        <span>{row.keyCustomerCount}</span>
                        <span>{formatPercent(row.progressRate)}</span>
                        <span>{row.riskGoalCount}</span>
                        <span>{row.overdueTaskCount}</span>
                        <span>{formatDateTime(row.lastFollowAt)}</span>
                        <button className="crm-dashboard-link-button" type="button" onClick={() => openSalesView(row.salespersonName)}>
                          查看个人盘
                        </button>
                      </div>
                    ))
                  ) : (
                    renderEmpty('暂无业务员汇总数据')
                  )}
                </div>
              ) : (
                <React.Fragment>
                  <div className="crm-dashboard-goal-grid">
                    {filteredSalesGoals.length > 0 ? (
                      filteredSalesGoals.map((goal) => {
                        const relatedTasks = scopedTasks.filter((item) => item.goalId === goal.id);
                        const goalSummary = getDashboardGoalSummary(goal, scopedTasks);
                        const linkedOrderCount = scopedOrders.filter((item) => item.customerId === goal.customerId).length;
                        const goalDisplayStatus = relatedTasks
                          .slice()
                          .sort((left, right) => toTimestamp(right.latestProgressAt) - toTimestamp(left.latestProgressAt))[0]
                          ?.status || goal.status;
                        const customerName = customerNameMap.get(goal.customerId) || '-';
                        const isSelected = selectedSalesGoal?.id === goal.id;
                        return (
                          <button
                            className={`crm-dashboard-sales-goal-card${isSelected ? ' is-selected' : ''}`}
                            key={goal.id}
                            type="button"
                            onClick={() => selectSalesGoal(goal.id)}
                          >
                            <div className="crm-dashboard-sales-goal-top">
                              <span className={`crm-dashboard-status-badge ${getStatusClass(goalDisplayStatus)}`}>{goalDisplayStatus}</span>
                            </div>
                            <strong>{goal.title}</strong>
                            <p>{goal.summary}</p>
                            <div className="crm-dashboard-sales-goal-metric">
                              <span>{goalSummary.headline}</span>
                              {goalSummary.progressText ? <span>{goalSummary.progressText}</span> : null}
                            </div>
                            <div className="crm-dashboard-progress-track">
                              <span style={{ width: `${goalSummary.percent}%` }} />
                            </div>
                            <div className="crm-dashboard-sales-goal-meta">
                              <span>客户：{customerName}</span>
                              <span>负责人：{goal.owner}</span>
                              <span>截止：{formatDate(goal.endDate)}</span>
                              <span>关联订单：{linkedOrderCount}</span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      renderEmpty('当前筛选条件下暂无目标')
                    )}
                  </div>

                  <div className="crm-dashboard-goal-task-section">
                    <div className="crm-dashboard-panel-header">
                      <div>
                        <div className="crm-dashboard-panel-title">
                          <span className="crm-dashboard-panel-bar" />
                          <span>目标下任务</span>
                        </div>
                      </div>
                      <div className="crm-dashboard-panel-summary">
                        <span>任务数 {selectedSalesGoalTasks.length}</span>
                        <span>进行中 {selectedSalesGoalTasks.filter((item) => item.status === '进行中').length}</span>
                        <span>风险 {selectedSalesGoalTasks.filter((item) => item.status === '有风险').length}</span>
                        <button
                          className="crm-dashboard-primary-button"
                          type="button"
                          onClick={() => setIsSalesTaskFormOpen(true)}
                          disabled={!selectedSalesGoal}
                        >
                          <Plus size={12} />
                          新建任务
                        </button>
                      </div>
                    </div>

                    {isSalesTaskFormOpen ? (
                      <React.Fragment>
                        <div className="crm-dashboard-drawer-mask" aria-hidden="true" onClick={closeSalesTaskForm} />
                        <div
                          aria-labelledby="crm-dashboard-task-modal-title"
                          aria-modal="true"
                          className="crm-dashboard-modal"
                          role="dialog"
                        >
                          <div className="crm-dashboard-modal-header">
                            <h3 id="crm-dashboard-task-modal-title">新建目标下任务</h3>
                            <button
                              aria-label="关闭新建任务弹窗"
                              className="crm-dashboard-icon-button"
                              type="button"
                              onClick={closeSalesTaskForm}
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <form className="crm-dashboard-inline-form is-modal" onSubmit={handleCreateSalesTask}>
                            <div className="crm-dashboard-form-grid">
                              <label>
                                <span>任务名称</span>
                                <input
                                  value={salesTaskForm.title}
                                  onChange={(event) => setSalesTaskForm((current) => ({ ...current, title: event.target.value }))}
                                  placeholder="例如：跟进预售产品的打板进度"
                                />
                              </label>
                              <label>
                                <span>指定人</span>
                                <input
                                  value={salesTaskForm.assignee}
                                  onChange={(event) => setSalesTaskForm((current) => ({ ...current, assignee: event.target.value }))}
                                />
                              </label>
                              <label>
                                <span>目标日期</span>
                                <input
                                  value={salesTaskForm.dueDate}
                                  onChange={(event) => setSalesTaskForm((current) => ({ ...current, dueDate: event.target.value }))}
                                />
                              </label>
                              <label>
                                <span>状态</span>
                                <select
                                  value={salesTaskForm.status}
                                  onChange={(event) =>
                                    setSalesTaskForm((current) => ({ ...current, status: event.target.value as TaskStatus }))
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
                                  value={salesTaskForm.priority}
                                  onChange={(event) =>
                                    setSalesTaskForm((current) => ({ ...current, priority: event.target.value as TaskPriority }))
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
                                  value={salesTaskForm.description}
                                  onChange={(event) =>
                                    setSalesTaskForm((current) => ({ ...current, description: event.target.value }))
                                  }
                                  placeholder="说明任务目标、动作和交付物"
                                />
                              </label>
                            </div>
                            <div className="crm-dashboard-form-actions">
                              <button className="crm-dashboard-ghost-button" type="button" onClick={closeSalesTaskForm}>
                                取消
                              </button>
                              <button className="crm-dashboard-primary-button" type="submit">
                                保存任务
                              </button>
                            </div>
                          </form>
                        </div>
                      </React.Fragment>
                    ) : null}

                    <div className="crm-dashboard-task-table">
                      <div className="crm-dashboard-task-head">
                        <span>任务名称</span>
                        <span>状态</span>
                        <span>优先级</span>
                        <span>指定人</span>
                        <span>目标日期</span>
                        <span>所属客户</span>
                        <span>最近更新</span>
                        <span>操作</span>
                      </div>
                      {selectedSalesGoal ? (
                        selectedSalesGoalTasks.length > 0 ? (
                          selectedSalesGoalTasks.map((task) => {
                            const latestLog = getTaskLatestLog(scopedLogs, task.id);
                            const taskCustomerName = customerNameMap.get(task.customerId) || '-';
                            return (
                              <div
                                className={`crm-dashboard-task-row${selectedSalesTask?.id === task.id ? ' is-selected' : ''}`}
                                key={task.id}
                              >
                                <div className="crm-dashboard-task-title">
                                  <strong>{task.title}</strong>
                                  <small>{task.description}</small>
                                </div>
                                <span className={`crm-dashboard-status-badge ${getStatusClass(task.status)}`}>{task.status}</span>
                                <span className={`crm-dashboard-priority-badge ${getPriorityClass(task.priority)}`}>{task.priority}</span>
                                <span>{task.assignee}</span>
                                <span>
                                  {isTaskOverdue(task) ? <span className="crm-dashboard-overdue-label">逾期</span> : null}
                                  {formatDate(task.dueDate)}
                                </span>
                                <span>{taskCustomerName}</span>
                                <span>{latestLog ? formatDate(latestLog.submittedAt) : '-'}</span>
                                <div className="crm-dashboard-task-actions">
                                  <button type="button" onClick={() => openSalesTask(task.id)}>
                                    查看
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="crm-dashboard-empty-row">当前目标下暂无任务。</div>
                        )
                      ) : (
                        <div className="crm-dashboard-empty-row">当前筛选条件下暂无可查看的目标。</div>
                      )}
                    </div>
                  </div>

                  {selectedSalesTask ? (
                    <React.Fragment>
                      <div className="crm-dashboard-drawer-mask" aria-hidden="true" onClick={closeSalesTaskDrawer} />
                      <aside className="crm-dashboard-task-drawer" aria-label="任务详情抽屉">
                        <div className="crm-dashboard-task-drawer-header">
                          <div>
                            <strong>{selectedSalesTask.title}</strong>
                            <span>{selectedSalesGoal?.title || '-'}</span>
                          </div>
                          <button className="crm-dashboard-ghost-button" type="button" onClick={closeSalesTaskDrawer}>
                            收起
                          </button>
                        </div>
                        <div className="crm-dashboard-task-drawer-body">
                          <div className="crm-dashboard-task-drawer-grid">
                            <div>
                              <span>所属目标</span>
                              <strong>{selectedSalesGoal?.title || '-'}</strong>
                            </div>
                            <div>
                              <span>所属客户</span>
                              <strong>{customerNameMap.get(selectedSalesTask.customerId) || '-'}</strong>
                            </div>
                            <div>
                              <span>指定人</span>
                              <strong>{selectedSalesTask.assignee}</strong>
                            </div>
                            <div>
                              <span>目标日期</span>
                              <strong>{formatDate(selectedSalesTask.dueDate)}</strong>
                            </div>
                            <div>
                              <span>任务状态</span>
                              <strong>{selectedSalesTask.status}</strong>
                            </div>
                            <div>
                              <span>优先级</span>
                              <strong>{selectedSalesTask.priority}</strong>
                            </div>
                            <div>
                              <span>最近更新</span>
                              <strong>
                                {selectedSalesTask.latestProgressAt
                                  ? formatDateTime(selectedSalesTask.latestProgressAt)
                                  : selectedSalesTaskLogs[0]
                                    ? formatDateTime(selectedSalesTaskLogs[0].submittedAt)
                                    : '-'}
                              </strong>
                            </div>
                            <div className="is-full">
                              <span>任务说明</span>
                              <strong>{selectedSalesTask.description || '暂无任务说明'}</strong>
                            </div>
                          </div>
                          <div className="crm-dashboard-task-drawer-section">
                            <div className="crm-dashboard-task-drawer-section-title">
                              <span className="crm-dashboard-panel-bar" />
                              <span>最新进度</span>
                            </div>
                            {selectedSalesTaskLogs[0] ? (
                              <div className="crm-dashboard-latest-progress">
                                <div>
                                  <span>最新提交人</span>
                                  <strong>{selectedSalesTaskLogs[0].submittedBy}</strong>
                                </div>
                                <div>
                                  <span>提交时间</span>
                                  <strong>{formatDateTime(selectedSalesTaskLogs[0].submittedAt)}</strong>
                                </div>
                                <div>
                                  <span>进度</span>
                                  <strong>{selectedSalesTaskLogs[0].progressPercent}%</strong>
                                </div>
                                <div>
                                  <span>任务状态</span>
                                  <strong>{selectedSalesTaskLogs[0].status}</strong>
                                </div>
                                <div className="is-full">
                                  <span>进度说明</span>
                                  <p>{selectedSalesTaskLogs[0].content}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="crm-dashboard-empty-state">当前任务还没有进度记录。</div>
                            )}
                          </div>
                          <div className="crm-dashboard-task-drawer-section">
                            <div className="crm-dashboard-task-drawer-section-title">
                              <span className="crm-dashboard-panel-bar" />
                              <span>进度时间线</span>
                            </div>
                            {selectedSalesTaskLogs.length > 0 ? (
                              <div className="crm-dashboard-task-timeline">
                                {selectedSalesTaskLogs.map((log) => (
                                  <article className="crm-dashboard-task-timeline-item" key={log.id}>
                                    <div className="crm-dashboard-task-timeline-dot" />
                                    <div className="crm-dashboard-task-timeline-card">
                                      <div className="crm-dashboard-task-log-head">
                                        <strong>{log.submittedBy}</strong>
                                        <span>{formatDateTime(log.submittedAt)}</span>
                                      </div>
                                      <div className="crm-dashboard-task-log-meta">
                                        <span>{log.progressPercent}%</span>
                                        <span className={`crm-dashboard-status-badge ${getStatusClass(log.status)}`}>
                                          {log.status}
                                        </span>
                                      </div>
                                      <p>{log.content}</p>
                                    </div>
                                  </article>
                                ))}
                              </div>
                            ) : (
                              <div className="crm-dashboard-empty-state">暂无进度记录。</div>
                            )}
                          </div>
                        </div>
                        <div className="crm-dashboard-task-drawer-footer">
                          <button className="crm-dashboard-primary-button" type="button" onClick={openSalesProgressModal}>
                            提交任务进度
                          </button>
                        </div>
                      </aside>
                    </React.Fragment>
                  ) : null}

                  {selectedSalesTask && isSalesProgressModalOpen ? (
                    <React.Fragment>
                      <div className="crm-dashboard-drawer-mask" aria-hidden="true" onClick={closeSalesProgressModal} />
                      <div className="crm-dashboard-modal" role="dialog" aria-modal="true" aria-label="提交任务进度">
                        <div className="crm-dashboard-modal-header">
                          <h3>提交任务进度</h3>
                          <button
                            aria-label="关闭提交进度弹窗"
                            className="crm-dashboard-icon-button"
                            type="button"
                            onClick={closeSalesProgressModal}
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <form className="crm-dashboard-inline-form is-modal" onSubmit={handleSubmitSalesProgress}>
                          <div className="crm-dashboard-form-grid">
                            <label>
                              <span>提交人</span>
                              <input
                                value={salesProgressForm.submittedBy}
                                onChange={(event) =>
                                  setSalesProgressForm((current) => ({ ...current, submittedBy: event.target.value }))
                                }
                              />
                            </label>
                            <label>
                              <span>进度%</span>
                              <input
                                value={salesProgressForm.progressPercent}
                                onChange={(event) =>
                                  setSalesProgressForm((current) => ({ ...current, progressPercent: event.target.value }))
                                }
                              />
                            </label>
                            <label>
                              <span>任务状态</span>
                              <select
                                value={salesProgressForm.status}
                                onChange={(event) =>
                                  setSalesProgressForm((current) => ({
                                    ...current,
                                    status: event.target.value as TaskStatus,
                                  }))
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
                                value={salesProgressForm.content}
                                onChange={(event) =>
                                  setSalesProgressForm((current) => ({ ...current, content: event.target.value }))
                                }
                                placeholder="支持文字说明、节点风险和结果反馈"
                              />
                            </label>
                          </div>
                          <div className="crm-dashboard-form-actions">
                            <button className="crm-dashboard-ghost-button" type="button" onClick={closeSalesProgressModal}>
                              取消
                            </button>
                            <button className="crm-dashboard-primary-button" type="submit">
                              提交进度
                            </button>
                          </div>
                        </form>
                      </div>
                    </React.Fragment>
                  ) : null}
                </React.Fragment>
              )}
            </article>

            <article className="crm-dashboard-panel">
              <div className="crm-dashboard-panel-header">
                <div>
                  <div className="crm-dashboard-panel-title">
                    <span className="crm-dashboard-panel-bar" />
                    <span>{currentView === 'leader' ? '客户清单区' : '我的客户分层与重点客户维护'}</span>
                  </div>
                                  </div>
              </div>

              <div className="crm-dashboard-chip-row">
                {customerFilterCards.map((card) => {
                  const isActive = selectedCustomerFilter === card.key;
                  return (
                    <button
                      key={card.key}
                      className={`crm-dashboard-chip-card${isActive ? ' is-active' : ''}`}
                      type="button"
                      onClick={() => setSelectedCustomerFilter((current) => (current === card.key ? 'all' : card.key))}
                    >
                      <span>{card.label}</span>
                      <strong>{card.count}</strong>
                    </button>
                  );
                })}
              </div>

              <div className="crm-dashboard-table-card">
                <div className="crm-dashboard-table-head">
                  <span>客户</span>
                  <span>归属 / 跟进</span>
                  <span>客户级别</span>
                  <span>最近跟进</span>
                  <span>最近下单</span>
                  <span>目标状态</span>
                  <span>未完任务</span>
                  <span>操作</span>
                </div>
                {filteredCustomerRows.length > 0 ? (
                  filteredCustomerRows.map((row) => {
                    return (
                      <div className="crm-dashboard-table-row" key={row.customerId}>
                        <div className="crm-dashboard-table-main">
                          <strong>{row.customerName}</strong>
                          <small>{formatCurrency(row.annualAmount)}</small>
                        </div>
                        <span>{row.owner} / {row.followUpBy}</span>
                        <span className={`crm-dashboard-importance-chip is-${row.importanceLevel}`}>
                          {row.importanceLevel === 'A' ? 'A级' : row.importanceLevel === 'B' ? 'B级' : 'C级'}
                        </span>
                        <span>{formatDateTime(row.lastFollowAt)}</span>
                        <span>{formatDateTime(row.lastOrderAt)}</span>
                        <div className="crm-dashboard-status-stack">
                          {row.riskGoalCount > 0 ? (
                            <span className="crm-dashboard-status-badge is-risk">有风险{row.riskGoalCount}</span>
                          ) : null}
                          {row.inProgressGoalCount > 0 ? (
                            <span className="crm-dashboard-status-badge is-active">进行中{row.inProgressGoalCount}</span>
                          ) : null}
                        </div>
                        <span>{row.openTaskCount} / 高优先 {row.highPriorityOpenTaskCount}</span>
                        <button className="crm-dashboard-link-button" type="button" onClick={() => viewCustomer(row.customerId)}>
                          进入客户
                        </button>
                      </div>
                    );
                  })
                ) : (
                  renderEmpty(selectedCustomerFilter === 'all' ? '当前视角暂无客户数据' : '当前筛选条件下暂无客户')
                )}
              </div>
                        </article>
          </div>

          <div className="crm-dashboard-secondary-column">
            <article className="crm-dashboard-panel">
              <div className="crm-dashboard-panel-header">
                <div>
                  <div className="crm-dashboard-panel-title">
                    <span className="crm-dashboard-panel-bar" />
                    <span>风险预警区</span>
                  </div>
                                  </div>
              </div>
              <div className="crm-dashboard-alert-list">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <article className={`crm-dashboard-alert-card is-${alert.severity}`} key={alert.id}>
                      <div className="crm-dashboard-alert-top">
                        <span className={`crm-dashboard-severity-chip is-${alert.severity}`}>{alert.severity}风险</span>
                        <strong>{alert.alertType}</strong>
                      </div>
                      <p>{alert.reason}</p>
                      <div className="crm-dashboard-alert-meta">
                        <span>客户：{alert.customerName}</span>
                        <span>责任人：{alert.owner || selectedOwner}</span>
                        <span>时限：{formatDate(alert.dueAt)}</span>
                      </div>
                      <div className="crm-dashboard-alert-foot">
                        <small>{alert.suggestedAction}</small>
                        <button className="crm-dashboard-link-button" type="button" onClick={() => viewCustomer(alert.customerId)}>
                          进入客户
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  renderEmpty('当前视角暂无风险提醒')
                )}
              </div>
            </article>

            <article className="crm-dashboard-panel">
              <div className="crm-dashboard-panel-header">
                <div>
                  <div className="crm-dashboard-panel-title">
                    <span className="crm-dashboard-panel-bar" />
                    <span>趋势分析区</span>
                  </div>
                </div>
              </div>
              <div className="crm-dashboard-chart-card">
                <div className="crm-dashboard-chart-head">
                  <strong>{currentView === 'leader' ? '团队跟进 / 下单趋势' : '我的跟进 / 下单趋势'}</strong>
                  <span>按最近 7 天统计</span>
                </div>
                <svg
                  className="crm-dashboard-line-chart"
                  viewBox="0 0 320 168"
                  onMouseLeave={() => setChartHoverIndex(null)}
                >
                  <path className="crm-dashboard-line-grid" d="M 0 42 H 320 M 0 84 H 320 M 0 126 H 320" />
                  <path className="crm-dashboard-line-axis" d="M 0 146 H 320" />
                  <path className="crm-dashboard-line-path is-follow" d={buildLinePath(trendBuckets.followValues, 320, 144)} />
                  <path className="crm-dashboard-line-path is-order" d={buildLinePath(trendBuckets.orderValues, 320, 144)} />
                  {trendBuckets.labels.map((label, index) => {
                    const x = trendBuckets.labels.length === 1 ? 160 : (320 / (trendBuckets.labels.length - 1)) * index;
                    const followY = 144 - (trendBuckets.followValues[index] / Math.max(...trendBuckets.followValues, 1)) * 144;
                    const orderY = 144 - (trendBuckets.orderValues[index] / Math.max(...trendBuckets.orderValues, 1)) * 144;
                    const isHovered = chartHoverIndex === index;
                    const slotWidth = trendBuckets.labels.length === 1 ? 320 : 320 / trendBuckets.labels.length;
                    const hitX = Math.max(0, x - slotWidth / 2);
                    const hitWidth = Math.min(320 - hitX, slotWidth);

                    return (
                      <g key={label}>
                        <rect
                          className="crm-dashboard-chart-hit-area"
                          x={hitX}
                          y={0}
                          width={hitWidth}
                          height={152}
                          onMouseEnter={() => setChartHoverIndex(index)}
                        />
                        {isHovered ? <line className="crm-dashboard-chart-guide-line" x1={x} y1={0} x2={x} y2={146} /> : null}
                        <circle className="crm-dashboard-chart-dot is-follow" cx={x} cy={followY} r={isHovered ? 4.5 : 0} />
                        <circle className="crm-dashboard-chart-dot is-order" cx={x} cy={orderY} r={isHovered ? 4.5 : 0} />
                        <text className="crm-dashboard-chart-axis-label" x={x} y={160} textAnchor="middle">
                          {label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                <div
                  className={`crm-dashboard-chart-tooltip${chartHoverIndex !== null ? ' is-visible' : ''}`}
                  style={
                    chartHoverIndex !== null
                      ? {
                          left: `${
                            trendBuckets.labels.length === 1
                              ? 50
                              : (chartHoverIndex / (trendBuckets.labels.length - 1)) * 100
                          }%`,
                        }
                      : undefined
                  }
                >
                  {chartHoverIndex !== null && (
                    <>
                      <div className="crm-dashboard-chart-tooltip-date">{trendBuckets.labels[chartHoverIndex]}</div>
                      <div className="crm-dashboard-chart-tooltip-row">
                        <span className="is-follow-dot"></span>
                        <span>{trendBuckets.followValues[chartHoverIndex]} 跟进</span>
                      </div>
                      <div className="crm-dashboard-chart-tooltip-row">
                        <span className="is-order-dot"></span>
                        <span>{trendBuckets.orderValues[chartHoverIndex]} 下单</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="crm-dashboard-structure-grid">
                <div className="crm-dashboard-structure-card">
                  <span>A级客户贡献</span>
                  <strong>{formatPercent(keyContribution)}</strong>
                  <small>按当前客户近一年金额占比估算</small>
                </div>
                <div className="crm-dashboard-structure-card">
                  <span>Top1 客户集中度</span>
                  <strong>{formatPercent(topOneConcentration)}</strong>
                  <small>判断是否过度依赖单一客户</small>
                </div>
                <div className="crm-dashboard-structure-card">
                  <span>跟进覆盖率</span>
                  <strong>{formatPercent(followCoverage)}</strong>
                  <small>最近 7 天有动作的客户占比</small>
                </div>
                <div className="crm-dashboard-structure-card">
                  <span>风险暴露率</span>
                  <strong>{formatPercent(riskExposure)}</strong>
                  <small>当前处于风险态的客户占比</small>
                </div>
              </div>

            </article>
          </div>
        </section>

        <div className="crm-dashboard-mobile-warning">
          页面已针对移动端做纵向堆叠适配，完整经营分析建议在桌面端查看。
        </div>
      </main>
    </div>
  );
});

export default Component;
