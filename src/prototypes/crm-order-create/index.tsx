/**
 * @name CRM 订单创建页
 *
 * 参考资料：
 * - /rules/development-guide.md
 * - /src/prototypes/crm-order-create/spec.md
 */

import './style.css';

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Boxes,
  ChevronDown,
  ChevronLeft,
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
  UserRound,
  Users,
  Wallet,
  Warehouse,
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
  shippingAddresses: string[];
};

type TaskStatus = '未开始' | '进行中' | '有风险' | '已完成';

type TaskRecord = {
  id: string;
  customerId: string;
  title: string;
  goalTitle: string;
  assignee: string;
  dueDate: string;
  status: TaskStatus;
};

type OrderFormState = {
  platform: string;
  platformOrderNo: string;
  currency: string;
  customerId: string;
  relatedTaskId: string;
  shippingAddress: string;
  salesperson: string;
  salespersonShare: string;
  followUpBy: string;
  followUpShare: string;
  orderTime: string;
  deliveryTime: string;
  shippingMode: string;
  discountAmount: string;
  note: string;
  warehouseShipping: string;
  freight: string;
  orderType: string;
};

const TASK_MEMORY_KEY = 'crm_order_create_task_memory_v1';

const EVENT_LIST: EventItem[] = [
  { name: 'on_change_customer', desc: '切换客户时触发', payload: '客户编号' },
  { name: 'on_change_task', desc: '切换关联任务时触发', payload: '客户编号与任务编号' },
  { name: 'on_submit_order', desc: '点击添加订单时触发', payload: '订单核心字段摘要' },
];

const ACTION_LIST: Action[] = [{ name: 'reset_form', desc: '重置表单为默认状态' }];

const VAR_LIST: KeyDesc[] = [
  { name: 'selected_customer_id', desc: '当前选中的客户编号' },
  { name: 'selected_task_id', desc: '当前选中的关联任务编号' },
  { name: 'open_task_count', desc: '当前客户未完成任务数量' },
  { name: 'remembered_task_id', desc: '当前客户上次选择的任务编号' },
];

const CONFIG_LIST: ConfigItem[] = [
  {
    type: 'input',
    attributeId: 'operator_name',
    displayName: '操作人名称',
    info: '显示在页面右上角头像左侧的用户名',
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
      { name: 'owner', desc: '业务员' },
      { name: 'follow_up_by', desc: '跟进人' },
      { name: 'shipping_addresses', desc: '收货地址列表' },
    ],
  },
  {
    name: 'task_items',
    desc: '客户任务数据',
    keys: [
      { name: 'id', desc: '任务编号' },
      { name: 'customer_id', desc: '客户编号' },
      { name: 'title', desc: '任务名称' },
      { name: 'goal_title', desc: '归属目标名称' },
      { name: 'assignee', desc: '任务负责人' },
      { name: 'due_date', desc: '目标日期' },
      { name: 'status', desc: '任务状态' },
    ],
  },
];

const PAGE_TAGS = [
  '仪表盘',
  '客户列表',
  '客户详情',
  '历史订单',
  '订单列表',
  '库存预警',
  '待采购列表',
  '已采购列表',
  '入库列表',
  '实时库存',
  '库存历史',
  '采购单详情',
  '产品列表',
  '新建订单',
];

const NAV_GROUPS: NavGroup[] = [
  { label: '仪表盘', icon: <LayoutDashboard size={14} /> },
  {
    label: '产品管理',
    icon: <Package size={14} />,
    items: [
      { label: '产品列表', icon: <Package size={13} /> },
      { label: '产品组合', icon: <Boxes size={13} /> },
      { label: '配钻列表', icon: <FileText size={13} /> },
    ],
  },
  {
    label: '销售管理',
    icon: <ShoppingBag size={14} />,
    items: [
      { label: '客户列表', icon: <Users size={13} /> },
      { label: '订单列表', icon: <FileText size={13} />, active: true },
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
      { label: '物流公司', icon: <Truck size={13} /> },
      { label: '打包待列表', icon: <Boxes size={13} /> },
    ],
  },
  { label: '财务管理', icon: <Wallet size={14} /> },
  { label: '系统管理', icon: <Settings size={14} /> },
];

const DEFAULT_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'K2604100347139123',
    name: '胡******户',
    owner: '黄家颖',
    followUpBy: '陈敏',
    shippingAddresses: ['深圳市南山区粤海街道科技园 2 栋 1803'],
  },
  {
    id: 'K2604210349432034',
    name: '谭****息',
    owner: '阿塔咪',
    followUpBy: '陈敏',
    shippingAddresses: ['黑龙江省哈尔滨市道里区中央大街 88 号'],
  },
  {
    id: 'K2604211152018593',
    name: '谭*******息',
    owner: '陈敏',
    followUpBy: '陈敏',
    shippingAddresses: ['奥兰群岛跨境集货点 2 号仓'],
  },
];

const DEFAULT_TASKS: TaskRecord[] = [
  {
    id: 'task-001',
    customerId: 'K2604100347139123',
    title: '推送新品首发资料包',
    goalTitle: '4月新品首发转化目标',
    assignee: '陈敏',
    dueDate: '2026-04-25',
    status: '进行中',
  },
  {
    id: 'task-003',
    customerId: 'K2604100347139123',
    title: '预售礼盒打板确认',
    goalTitle: '预售礼盒打板里程碑',
    assignee: '陈敏',
    dueDate: '2026-04-24',
    status: '有风险',
  },
  {
    id: 'task-004',
    customerId: 'K2604100347139123',
    title: '确认预售上架节点',
    goalTitle: '预售礼盒打板里程碑',
    assignee: '黄家颖',
    dueDate: '2026-05-03',
    status: '未开始',
  },
  {
    id: 'task-005',
    customerId: 'K2604210349432034',
    title: 'A产品复购订单催单',
    goalTitle: 'A产品组合复购拉升',
    assignee: '阿塔咪',
    dueDate: '2026-04-27',
    status: '进行中',
  },
  {
    id: 'task-007',
    customerId: 'K2604210349432034',
    title: '新品B样品寄送',
    goalTitle: '新品B首单推进',
    assignee: '陈敏',
    dueDate: '2026-04-24',
    status: '进行中',
  },
  {
    id: 'task-010',
    customerId: 'K2604211152018593',
    title: '完成本周复购复盘',
    goalTitle: '周度复购金额目标',
    assignee: '陈敏',
    dueDate: '2026-04-22',
    status: '已完成',
  },
];

const INITIAL_FORM: OrderFormState = {
  platform: '独立站',
  platformOrderNo: '',
  currency: '人民币',
  customerId: DEFAULT_CUSTOMERS[0]?.id || '',
  relatedTaskId: '',
  shippingAddress: '',
  salesperson: '',
  salespersonShare: '100',
  followUpBy: '',
  followUpShare: '0',
  orderTime: '2026-04-27 10:30',
  deliveryTime: '',
  shippingMode: '国内现货',
  discountAmount: '',
  note: '',
  warehouseShipping: '否',
  freight: '',
  orderType: '成品单',
};

function normalizeCustomers(source: unknown): CustomerRecord[] {
  if (!Array.isArray(source)) {
    return DEFAULT_CUSTOMERS;
  }
  const normalized = source
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const raw = item as Record<string, unknown>;
      const addressSource = raw.shipping_addresses ?? raw.shippingAddresses ?? raw['收货地址列表'];
      const shippingAddresses = Array.isArray(addressSource)
        ? addressSource.map((entry) => String(entry || '').trim()).filter(Boolean)
        : [String(raw.shipping_address ?? raw.shippingAddress ?? raw['收货地址'] ?? '').trim()].filter(Boolean);
      return {
        id: String(raw.id ?? ''),
        name: String(raw.name ?? raw.customer_name ?? raw['客户名称'] ?? ''),
        owner: String(raw.owner ?? raw.salesperson ?? raw['业务员'] ?? ''),
        followUpBy: String(raw.follow_up_by ?? raw.followUpBy ?? raw['跟进人'] ?? ''),
        shippingAddresses,
      };
    })
    .filter((item): item is CustomerRecord => Boolean(item?.id && item?.name));
  return normalized.length > 0 ? normalized : DEFAULT_CUSTOMERS;
}

function normalizeTasks(source: unknown): TaskRecord[] {
  if (!Array.isArray(source)) {
    return DEFAULT_TASKS;
  }
  const normalized = source
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const raw = item as Record<string, unknown>;
      return {
        id: String(raw.id ?? ''),
        customerId: String(raw.customer_id ?? raw.customerId ?? raw['客户编号'] ?? ''),
        title: String(raw.title ?? raw['任务名称'] ?? ''),
        goalTitle: String(raw.goal_title ?? raw.goalTitle ?? raw['目标名称'] ?? '未分组目标'),
        assignee: String(raw.assignee ?? raw.owner ?? raw['任务负责人'] ?? ''),
        dueDate: String(raw.due_date ?? raw.dueDate ?? raw['目标日期'] ?? ''),
        status: String(raw.status ?? raw['任务状态'] ?? '未开始') as TaskStatus,
      };
    })
    .filter((item): item is TaskRecord => Boolean(item?.id && item?.customerId && item?.title));
  return normalized.length > 0 ? normalized : DEFAULT_TASKS;
}

function readTaskMemory(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(TASK_MEMORY_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[0] === 'string' && typeof entry[1] === 'string'),
    );
  } catch {
    return {};
  }
}

function writeTaskMemory(memory: Record<string, string>) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(TASK_MEMORY_KEY, JSON.stringify(memory));
}

function isOpenTask(task: TaskRecord): boolean {
  return task.status !== '已完成';
}

const Component = forwardRef<AxureHandle, AxureProps>(function CrmOrderCreate(props, ref) {
  const { data, config, onEvent } = props;
  const operatorName = String(config?.operator_name ?? '阿塔咪');
  const customers = useMemo(() => normalizeCustomers(data?.customers), [data?.customers]);
  const tasks = useMemo(() => normalizeTasks(data?.task_items), [data?.task_items]);
  const [taskMemoryMap, setTaskMemoryMap] = useState<Record<string, string>>(() => readTaskMemory());
  const [isCustomerTaskPickerOpen, setIsCustomerTaskPickerOpen] = useState(false);
  const [customerTaskPickerStep, setCustomerTaskPickerStep] = useState<'customer' | 'task'>('customer');
  const [form, setForm] = useState<OrderFormState>(() => ({
    ...INITIAL_FORM,
    customerId: customers[0]?.id || '',
  }));
  const customerTaskPickerRef = useRef<HTMLDivElement | null>(null);

  const currentCustomer = useMemo(
    () => customers.find((item) => item.id === form.customerId) || null,
    [customers, form.customerId],
  );
  const openTasks = useMemo(
    () => tasks.filter((task) => task.customerId === form.customerId && isOpenTask(task)),
    [form.customerId, tasks],
  );
  const rememberedTaskId = form.customerId ? taskMemoryMap[form.customerId] || '' : '';
  const rememberedTask = useMemo(
    () => openTasks.find((task) => task.id === rememberedTaskId) || null,
    [openTasks, rememberedTaskId],
  );
  const selectedTask = useMemo(
    () => openTasks.find((task) => task.id === form.relatedTaskId) || null,
    [form.relatedTaskId, openTasks],
  );
  const customerTaskDisplay = useMemo(() => {
    if (currentCustomer && selectedTask) {
      return `${currentCustomer.name} / ${selectedTask.title}`;
    }
    if (currentCustomer) {
      return currentCustomer.name;
    }
    return '请选择客户和任务';
  }, [currentCustomer, selectedTask]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!customerTaskPickerRef.current?.contains(event.target as Node)) {
        setIsCustomerTaskPickerOpen(false);
        setCustomerTaskPickerStep('customer');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (!form.customerId) {
      setForm((prev) => ({
        ...prev,
        relatedTaskId: '',
        shippingAddress: '',
        salesperson: '',
        followUpBy: '',
      }));
      return;
    }

    const nextTaskId = rememberedTask?.id || '';
    setForm((prev) => ({
      ...prev,
      customerId: form.customerId,
      relatedTaskId: nextTaskId,
      shippingAddress: currentCustomer?.shippingAddresses[0] || '',
      salesperson: currentCustomer?.owner || '',
      followUpBy: currentCustomer?.followUpBy || '',
    }));
  }, [currentCustomer, form.customerId, openTasks, rememberedTask]);

  const emitEvent = (name: string, payload: Record<string, unknown>) => {
    onEvent?.(name, JSON.stringify(payload));
  };

  const rememberTaskForCustomer = (customerId: string, taskId: string) => {
    if (!customerId || !taskId) {
      return;
    }
    const nextMemory = { ...taskMemoryMap, [customerId]: taskId };
    setTaskMemoryMap(nextMemory);
    writeTaskMemory(nextMemory);
  };

  const handleFieldChange = <K extends keyof OrderFormState>(key: K, value: OrderFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCustomerChange = (customerId: string) => {
    setForm((prev) => ({ ...prev, customerId }));
    emitEvent('on_change_customer', { customer_id: customerId });
  };

  const handleCustomerTaskCustomerSelect = (customerId: string) => {
    handleCustomerChange(customerId);
    setCustomerTaskPickerStep('task');
  };

  const handleTaskChange = (taskId: string) => {
    setForm((prev) => ({ ...prev, relatedTaskId: taskId }));
    rememberTaskForCustomer(form.customerId, taskId);
    emitEvent('on_change_task', { customer_id: form.customerId, task_id: taskId });
    setIsCustomerTaskPickerOpen(false);
    setCustomerTaskPickerStep('customer');
  };

  const handleSubmit = () => {
    if (!form.customerId) {
      return;
    }
    if (form.relatedTaskId) {
      rememberTaskForCustomer(form.customerId, form.relatedTaskId);
    }
    emitEvent('on_submit_order', {
      customer_id: form.customerId,
      task_id: form.relatedTaskId,
      platform_order_no: form.platformOrderNo,
      order_type: form.orderType,
    });
  };

  const resetForm = () => {
    setForm({
      ...INITIAL_FORM,
      customerId: customers[0]?.id || '',
    });
  };

  useImperativeHandle(ref, () => ({
    getVar(name) {
      switch (name) {
        case 'selected_customer_id':
          return form.customerId;
        case 'selected_task_id':
          return form.relatedTaskId;
        case 'open_task_count':
          return openTasks.length;
        case 'remembered_task_id':
          return rememberedTaskId;
        default:
          return undefined;
      }
    },
    fireAction(name) {
      if (name === 'reset_form') {
        resetForm();
      }
    },
    eventList: EVENT_LIST,
    actionList: ACTION_LIST,
    varList: VAR_LIST,
    configList: CONFIG_LIST,
    dataList: DATA_LIST,
  }));

  return (
    <div className="crm-order-create-shell">
      <div className="crm-order-create-logo">
        <div className="crm-order-create-logo-mark" aria-hidden="true">
          <span />
        </div>
        <div className="crm-order-create-logo-text">CLEARAL</div>
      </div>

      <header className="crm-order-create-topbar">
        <div className="crm-order-create-topbar-left">
          <button className="crm-order-create-icon-button" type="button" aria-label="展开菜单">
            <Menu size={14} />
          </button>
          <div className="crm-order-create-breadcrumb">
            <span>销售管理</span>
            <span>/</span>
            <span>订单列表</span>
            <span>/</span>
            <span className="active">新建订单</span>
          </div>
        </div>

        <div className="crm-order-create-topbar-right">
          <span className="crm-order-create-operator">{operatorName}</span>
          <div className="crm-order-create-avatar" aria-hidden="true">
            喵
          </div>
        </div>
      </header>

      <aside className="crm-order-create-sidebar">
        <div className="crm-order-create-nav">
          {NAV_GROUPS.map((group) => (
            <div className="crm-order-create-nav-group" key={group.label}>
              <button className="crm-order-create-nav-parent" type="button">
                <span className="crm-order-create-nav-parent-label">
                  {group.icon}
                  <span>{group.label}</span>
                </span>
                {group.items ? <ChevronDown size={14} /> : null}
              </button>
              {group.items ? (
                <div className="crm-order-create-nav-children">
                  {group.items.map((item) => (
                    <button
                      className={`crm-order-create-nav-child${item.active ? ' is-active' : ''}`}
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
        </div>
      </aside>

      <main className="crm-order-create-main">
        <div className="crm-order-create-tag-strip">
          {PAGE_TAGS.map((tag) => (
            <button
              className={`crm-order-create-page-tag${tag === '新建订单' ? ' is-active' : ''}`}
              key={tag}
              type="button"
            >
              <span>{tag}</span>
            </button>
          ))}
        </div>

        <div className="crm-order-create-card">
          <section className="crm-order-create-section">
            <div className="crm-order-create-section-header">
              <h1>新增订单</h1>
            </div>

            <div className="crm-order-create-subsection">
              <div className="crm-order-create-subsection-title">
                <span className="crm-order-create-section-bar" />
                <span>基础信息</span>
              </div>

              <div className="crm-order-create-form-grid">
                <label className="crm-order-create-field">
                  <span>* 选择平台</span>
                  <select value={form.platform} onChange={(event) => handleFieldChange('platform', event.target.value)}>
                    <option value="独立站">独立站</option>
                    <option value="阿里国际站">阿里国际站</option>
                    <option value="线下转单">线下转单</option>
                  </select>
                </label>

                <label className="crm-order-create-field">
                  <span>* 平台单号</span>
                  <input
                    value={form.platformOrderNo}
                    onChange={(event) => handleFieldChange('platformOrderNo', event.target.value)}
                    placeholder="请输入"
                  />
                </label>

                <label className="crm-order-create-field">
                  <span>* 币种</span>
                  <select value={form.currency} onChange={(event) => handleFieldChange('currency', event.target.value)}>
                    <option value="人民币">人民币</option>
                    <option value="美元">美元</option>
                    <option value="欧元">欧元</option>
                  </select>
                </label>

                <label className="crm-order-create-field crm-order-create-field customer-task-field">
                  <span>* 客户</span>
                  <div className="crm-order-create-cascader" ref={customerTaskPickerRef}>
                    <button
                      aria-expanded={isCustomerTaskPickerOpen}
                      className="crm-order-create-cascader-trigger"
                      type="button"
                      onClick={() => {
                        setCustomerTaskPickerStep('customer');
                        setIsCustomerTaskPickerOpen((current) => !current);
                      }}
                    >
                      <span className={`crm-order-create-cascader-value${selectedTask ? '' : ' is-placeholder'}`}>
                        {customerTaskDisplay}
                      </span>
                      <ChevronDown size={14} />
                    </button>

                    {isCustomerTaskPickerOpen ? (
                      <div className="crm-order-create-cascader-panel">
                        <div className="crm-order-create-cascader-header">
                          {customerTaskPickerStep === 'task' ? (
                            <button
                              className="crm-order-create-cascader-back"
                              type="button"
                              onClick={() => setCustomerTaskPickerStep('customer')}
                            >
                              <ChevronLeft size={14} />
                              <span>返回客户</span>
                            </button>
                          ) : (
                            <span>选择客户</span>
                          )}
                          <strong>{customerTaskPickerStep === 'task' ? currentCustomer?.name || '请选择客户' : '请选择客户'}</strong>
                        </div>

                        <div className="crm-order-create-cascader-options">
                          {customerTaskPickerStep === 'customer'
                            ? customers.map((customer) => (
                                <button
                                  className={`crm-order-create-cascader-option${
                                    form.customerId === customer.id ? ' is-selected' : ''
                                  }`}
                                  key={customer.id}
                                  type="button"
                                  onClick={() => handleCustomerTaskCustomerSelect(customer.id)}
                                >
                                  <span>{customer.name}</span>
                                </button>
                              ))
                            : openTasks.length > 0
                              ? openTasks.map((task) => (
                                  <button
                                    className={`crm-order-create-cascader-option${
                                      form.relatedTaskId === task.id ? ' is-selected' : ''
                                    }`}
                                    key={task.id}
                                    type="button"
                                    onClick={() => handleTaskChange(task.id)}
                                  >
                                    <span>{task.title}</span>
                                  </button>
                                ))
                              : (
                                  <div className="crm-order-create-cascader-empty">当前客户暂无未完成任务</div>
                                )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </label>

                <label className="crm-order-create-field">
                  <span>* 收货地址</span>
                  <select
                    value={form.shippingAddress}
                    onChange={(event) => handleFieldChange('shippingAddress', event.target.value)}
                  >
                    {(currentCustomer?.shippingAddresses || []).map((address) => (
                      <option key={address} value={address}>
                        {address}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="crm-order-create-field">
                  <span>* 业务员</span>
                  <input value={form.salesperson} readOnly />
                </label>

                <label className="crm-order-create-field">
                  <span>* 业务员业绩占比(%)</span>
                  <input
                    value={form.salespersonShare}
                    onChange={(event) => handleFieldChange('salespersonShare', event.target.value)}
                    placeholder="请输入"
                  />
                </label>

                <label className="crm-order-create-field">
                  <span>跟进人</span>
                  <input value={form.followUpBy} readOnly />
                </label>

                <label className="crm-order-create-field">
                  <span>跟进人业绩占比(%)</span>
                  <input
                    value={form.followUpShare}
                    onChange={(event) => handleFieldChange('followUpShare', event.target.value)}
                    placeholder="请输入"
                  />
                </label>

                <label className="crm-order-create-field">
                  <span>* 发货形式</span>
                  <select value={form.shippingMode} onChange={(event) => handleFieldChange('shippingMode', event.target.value)}>
                    <option value="国内现货">国内现货</option>
                    <option value="海外直发">海外直发</option>
                    <option value="分批发货">分批发货</option>
                  </select>
                </label>

                <label className="crm-order-create-field">
                  <span>* 下单时间</span>
                  <input
                    type="datetime-local"
                    value={form.orderTime}
                    onChange={(event) => handleFieldChange('orderTime', event.target.value)}
                  />
                </label>

                <label className="crm-order-create-field">
                  <span>* 交货时间</span>
                  <input
                    type="datetime-local"
                    value={form.deliveryTime}
                    onChange={(event) => handleFieldChange('deliveryTime', event.target.value)}
                  />
                </label>

                <label className="crm-order-create-field">
                  <span>* 优惠金额</span>
                  <input
                    value={form.discountAmount}
                    onChange={(event) => handleFieldChange('discountAmount', event.target.value)}
                    placeholder="¥ 请输入"
                  />
                </label>

                <label className="crm-order-create-field">
                  <span>订单备注</span>
                  <input value={form.note} onChange={(event) => handleFieldChange('note', event.target.value)} placeholder="请输入" />
                </label>

                <label className="crm-order-create-field">
                  <span>是否入库发货</span>
                  <select
                    value={form.warehouseShipping}
                    onChange={(event) => handleFieldChange('warehouseShipping', event.target.value)}
                  >
                    <option value="否">否</option>
                    <option value="是">是</option>
                  </select>
                </label>

                <label className="crm-order-create-field">
                  <span>运费</span>
                  <input value={form.freight} onChange={(event) => handleFieldChange('freight', event.target.value)} placeholder="请输入" />
                </label>
              </div>
            </div>

            <div className="crm-order-create-subsection order-detail-section">
              <div className="crm-order-create-subsection-title">
                <span className="crm-order-create-section-bar" />
                <span>订单详情</span>
              </div>

              <div className="crm-order-create-inline-row">
                <label className="crm-order-create-field inline-field">
                  <span>* 订单类型</span>
                  <select value={form.orderType} onChange={(event) => handleFieldChange('orderType', event.target.value)}>
                    <option value="成品单">成品单</option>
                    <option value="打样单">打样单</option>
                    <option value="补货单">补货单</option>
                  </select>
                </label>
              </div>

              <div className="crm-order-create-order-table">
                <div className="crm-order-create-order-head">
                  <span>产品ID</span>
                  <span>总数</span>
                  <span>销售总价</span>
                  <span>规格图片</span>
                  <span>规格名称</span>
                  <span>销售单价</span>
                  <span>数量</span>
                  <span>定制化属性</span>
                  <span>订单规格备注</span>
                  <span>供应商单价</span>
                  <span>供应商总成本</span>
                  <span>本规格销售总价</span>
                  <span>操作</span>
                </div>
                <div className="crm-order-create-order-empty">暂无数据</div>
                <button className="crm-order-create-add-product" type="button">
                  <Plus size={14} />
                  <span>请选择产品</span>
                </button>
              </div>
            </div>

            <div className="crm-order-create-footer-bar">
              <span>产品共计：0件</span>
              <span>预计成本：¥0.00</span>
              <span>预计毛利(按汇率换算)：¥0.00</span>
              <span>预计毛利率：0.00%</span>
              <span>总金额(含客户运费)：¥0.00</span>
            </div>

            <div className="crm-order-create-actions">
              <button className="crm-order-create-secondary-button" type="button" onClick={resetForm}>
                取消
              </button>
              <button className="crm-order-create-secondary-button" type="button">
                暂存
              </button>
              <button className="crm-order-create-primary-button" type="button" onClick={handleSubmit}>
                添加订单
              </button>
            </div>
          </section>
        </div>
      </main>

      <button className="crm-order-create-float-back" type="button" aria-label="返回">
        <Search size={16} />
      </button>
    </div>
  );
});

export default Component;
