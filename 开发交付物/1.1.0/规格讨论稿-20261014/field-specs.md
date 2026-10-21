# 字段业务规格

以下为产品语义与保存时点。物理表、索引、生产报文字段类型及接口映射须在真实工程中补齐；候选键不冒充正式协议。

#### DFIELD-001 应用标识

**标识**：DFIELD-001

**名称**：应用标识

**entity**：Application

**存储语义键**：appId

**类型**：string

**格式**：稳定独立标识；DCC/天网分别使用独立应用，不能用显示名代替；格式长度待工程定义。

**允许为空**：False

**必填条件**：保存应用/换身份

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 稳定独立标识；DCC/天网分别使用独立应用，不能用显示名代替；格式长度待工程定义。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 超管

**write**

1. 本方仅创建成功时生成；普通修改/查看不可变更

**生命周期**

#### 1

**state**：输入/接收

**行为**：稳定独立标识；DCC/天网分别使用独立应用，不能用显示名代替；格式长度待工程定义。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：稳定独立标识；DCC/天网分别使用独立应用，不能用显示名代替；格式长度待工程定义。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-069, memory/project-facts.json

**business_rule_ids**

1. BR-001

2. BR-020

**示例**

**valid**

1. 按“保存应用/换身份”及本字段格式填写/取得合成应用标识

**invalid**

1. 缺必需应用标识、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-005

3. CHECK-006

4. CHECK-007

5. CHECK-009

6. CHECK-010

7. CHECK-012

8. CHECK-014

9. CHECK-015

10. CHECK-017

11. CHECK-019

12. CHECK-029

13. CHECK-030

14. CHECK-031

15. CHECK-032

16. CHECK-036

17. CHECK-044

18. CHECK-045

19. CHECK-047

20. CHECK-048

21. CHECK-049

22. CHECK-050

23. CHECK-051

24. CHECK-052

25. CHECK-053

26. CHECK-054

27. CHECK-055

28. CHECK-056

29. CHECK-057

30. CHECK-058

31. CHECK-059

32. CHECK-060

33. CHECK-069

**historical_source_refs**

1. memory/business-rules.json#BR-001

2. memory/business-rules.json#BR-020

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-069, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-002 应用名称

**标识**：DFIELD-002

**名称**：应用名称

**entity**：Application

**存储语义键**：name

**类型**：string

**格式**：名称必填；长度/重名策略未冻结，演示60字及重名限制不成为业务事实；改名不改历史来源。

**允许为空**：False

**必填条件**：新增或修改应用

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 名称必填；长度/重名策略未冻结，演示60字及重名限制不成为业务事实；改名不改历史来源。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 超管

**write**

1. 超管通过当前准确应用的对应CRUD；服务端逐次核权

**生命周期**

#### 1

**state**：输入/接收

**行为**：名称必填；长度/重名策略未冻结，演示60字及重名限制不成为业务事实；改名不改历史来源。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：input

**rule**：名称必填；长度/重名策略未冻结，演示60字及重名限制不成为业务事实；改名不改历史来源。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-069, memory/project-facts.json

**business_rule_ids**

1. BR-001

2. BR-020

**示例**

**valid**

1. 按“新增或修改应用”及本字段格式填写/取得合成应用名称

**invalid**

1. 缺必需应用名称、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-005

3. CHECK-006

4. CHECK-007

5. CHECK-009

6. CHECK-010

7. CHECK-012

8. CHECK-014

9. CHECK-015

10. CHECK-017

11. CHECK-019

12. CHECK-029

13. CHECK-030

14. CHECK-031

15. CHECK-032

16. CHECK-036

17. CHECK-044

18. CHECK-045

19. CHECK-047

20. CHECK-048

21. CHECK-049

22. CHECK-050

23. CHECK-051

24. CHECK-052

25. CHECK-053

26. CHECK-054

27. CHECK-055

28. CHECK-056

29. CHECK-057

30. CHECK-058

31. CHECK-059

32. CHECK-060

33. CHECK-069

**historical_source_refs**

1. memory/business-rules.json#BR-001

2. memory/business-rules.json#BR-020

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-069, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-003 接入密钥

**标识**：DFIELD-003

**名称**：接入密钥

**entity**：Application

**存储语义键**：appSecret

**类型**：opaque string

**格式**：仅用于获取授权tenant token；详情默认掩码，显示/复制不重置；原型仅合成，真实算法/存储待核。

**允许为空**：False

**必填条件**：创建成功/换身份

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 仅用于获取授权tenant token；详情默认掩码，显示/复制不重置；原型仅合成，真实算法/存储待核。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 有权认证/密钥读取方；普通运营页面和日志不展示明文凭据

**write**

1. 本方仅创建成功时生成不可用合成密钥；普通修改/查看/复制不重置；真实方案待工程

**生命周期**

#### 1

**state**：输入/接收

**行为**：仅用于获取授权tenant token；详情默认掩码，显示/复制不重置；原型仅合成，真实算法/存储待核。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：仅用于获取授权tenant token；详情默认掩码，显示/复制不重置；原型仅合成，真实算法/存储待核。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-069, memory/project-facts.json

**business_rule_ids**

1. BR-001

2. BR-020

**示例**

**valid**

1. 按“创建成功/换身份”及本字段格式填写/取得合成接入密钥

**invalid**

1. 缺必需接入密钥、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-005

3. CHECK-006

4. CHECK-007

5. CHECK-009

6. CHECK-010

7. CHECK-012

8. CHECK-014

9. CHECK-015

10. CHECK-017

11. CHECK-019

12. CHECK-029

13. CHECK-030

14. CHECK-031

15. CHECK-032

16. CHECK-036

17. CHECK-044

18. CHECK-045

19. CHECK-047

20. CHECK-048

21. CHECK-049

22. CHECK-050

23. CHECK-051

24. CHECK-052

25. CHECK-053

26. CHECK-054

27. CHECK-055

28. CHECK-056

29. CHECK-057

30. CHECK-058

31. CHECK-059

32. CHECK-060

33. CHECK-069

**historical_source_refs**

1. memory/business-rules.json#BR-001

2. memory/business-rules.json#BR-020

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-069, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-004 可访问租户

**标识**：DFIELD-004

**名称**：可访问租户

**entity**：Application

**存储语义键**：authorizedTenantIds

**类型**：array<string>

**格式**：有效租户标识集合；应用可关联多个租户，同一租户可关联多个应用；不重复关联，无效租户拒绝。空集合不授任意租户；是否允许未关联应用草稿待审。解除关联的旧token/在途策略待核。

**允许为空**：False

**必填条件**：新增/修改/换身份

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 有效租户标识集合；应用可关联多个租户，同一租户可关联多个应用；不重复关联，无效租户拒绝。空集合不授任意租户；是否允许未关联应用草稿待审。解除关联的旧token/在途策略待核。

2. 不以默认值、显示名或历史最近值补齐真实关联；未适用字段不伪造。

**权限**

**read**

1. 超管

**write**

1. 超管通过当前准确应用的对应CRUD；服务端逐次核权

**生命周期**

#### 1

**state**：输入/接收

**行为**：有效租户标识集合；应用可关联多个租户，同一租户可关联多个应用；不重复关联，无效租户拒绝。空集合不授任意租户；是否允许未关联应用草稿待审。解除关联的旧token/在途策略待核。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：input

**rule**：有效租户标识集合；应用可关联多个租户，同一租户可关联多个应用；不重复关联，无效租户拒绝。空集合不授任意租户；是否允许未关联应用草稿待审。解除关联的旧token/在途策略待核。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-085, memory/normalized-user-stories.json#AC-092, memory/project-facts.json

**business_rule_ids**

1. BR-001

2. BR-020

**示例**

**valid**

1. 按“新增/修改/换身份”及本字段格式填写/取得合成可访问租户

**invalid**

1. 缺必需可访问租户、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-017

2. CHECK-045

3. CHECK-055

4. CHECK-056

5. CHECK-085

6. CHECK-092

**historical_source_refs**

1. memory/business-rules.json#BR-001

2. memory/business-rules.json#BR-020

**来源映射**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-085, memory/normalized-user-stories.json#AC-092, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-005 应用创建时间

**标识**：DFIELD-005

**名称**：应用创建时间

**entity**：Application

**存储语义键**：createdAt

**类型**：timestamp

**格式**：本方保存创建时刻，普通修改/查看不重建；展示北京时间，物理编码待工程定。

**允许为空**：False

**必填条件**：创建成功

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 本方保存创建时刻，普通修改/查看不重建；展示北京时间，物理编码待工程定。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 超管

**write**

1. 超管通过当前准确应用的对应CRUD；服务端逐次核权

**生命周期**

#### 1

**state**：输入/接收

**行为**：本方保存创建时刻，普通修改/查看不重建；展示北京时间，物理编码待工程定。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：本方保存创建时刻，普通修改/查看不重建；展示北京时间，物理编码待工程定。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/project-facts.json

**business_rule_ids**

1. BR-020

**示例**

**valid**

1. 按“创建成功”及本字段格式填写/取得合成应用创建时间

**invalid**

1. 缺必需应用创建时间、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-017

2. CHECK-044

3. CHECK-045

4. CHECK-053

5. CHECK-054

6. CHECK-055

7. CHECK-056

8. CHECK-057

9. CHECK-058

**historical_source_refs**

1. memory/business-rules.json#BR-020

**来源映射**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-006 应用删除事实

**标识**：DFIELD-006

**名称**：应用删除事实

**entity**：Application

**存储语义键**：deleted

**类型**：boolean

**格式**：仅所选应用删除成功后生效；保存失败不提前撤权，其他应用与历史业务保留；真实失效能力待核。

**允许为空**：False

**必填条件**：删除成功及身份校验

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 仅所选应用删除成功后生效；保存失败不提前撤权，其他应用与历史业务保留；真实失效能力待核。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 超管

**write**

1. 超管通过当前准确应用的对应CRUD；服务端逐次核权

**生命周期**

#### 1

**state**：输入/接收

**行为**：仅所选应用删除成功后生效；保存失败不提前撤权，其他应用与历史业务保留；真实失效能力待核。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：仅所选应用删除成功后生效；保存失败不提前撤权，其他应用与历史业务保留；真实失效能力待核。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/project-facts.json

**business_rule_ids**

1. BR-020

**示例**

**valid**

1. 按“删除成功及身份校验”及本字段格式填写/取得合成应用删除事实

**invalid**

1. 缺必需应用删除事实、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-017

2. CHECK-044

3. CHECK-045

4. CHECK-053

5. CHECK-054

6. CHECK-055

7. CHECK-056

8. CHECK-057

9. CHECK-058

**historical_source_refs**

1. memory/business-rules.json#BR-020

**来源映射**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-007 列表查询条件

**标识**：DFIELD-007

**名称**：列表查询条件

**entity**：ApplicationList

**存储语义键**：keyword

**类型**：string

**格式**：名称或appId，空字符串表示不筛选；查询不写业务对象。

**允许为空**：False

**必填条件**：应用查询

**默认值**

**kind**：literal

**value**：

**rule**：新列表或重置默认无筛选。

**校验规则**

1. 名称或appId，空字符串表示不筛选；查询不写业务对象。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 超管

**write**

1. 超管当前查询交互

**生命周期**

#### 1

**state**：输入/接收

**行为**：名称或appId，空字符串表示不筛选；查询不写业务对象。

#### 2

**state**：确认/更新

**行为**：当前会话/请求内生效，不变更已保存业务事实。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：名称或appId，空字符串表示不筛选；查询不写业务对象。

**dependencies**



**保存**

**kind**：transient

**保存时机**：仅当前交互/请求中持有；取消/输入版本变化失效，不作为持久业务真相。

**来源**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/project-facts.json

**business_rule_ids**

1. BR-020

**示例**

**valid**

1. 按“应用查询”及本字段格式填写/取得合成列表查询条件

**invalid**

1. 缺必需列表查询条件、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-017

2. CHECK-044

3. CHECK-045

4. CHECK-053

5. CHECK-054

6. CHECK-055

7. CHECK-056

8. CHECK-057

9. CHECK-058

**historical_source_refs**

1. memory/business-rules.json#BR-020

**来源映射**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-008 列表页码

**标识**：DFIELD-008

**名称**：列表页码

**entity**：ApplicationList

**存储语义键**：page

**类型**：integer

**格式**：正整数；首屏1，页大小为实现参数未冻结，越界处理不得伪造应用。

**允许为空**：False

**必填条件**：分页查询

**默认值**

**kind**：literal

**value**：1

**rule**：新列表或筛选重置到首屏。

**校验规则**

1. 正整数；首屏1，页大小为实现参数未冻结，越界处理不得伪造应用。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 超管

**write**

1. 超管当前查询交互

**生命周期**

#### 1

**state**：输入/接收

**行为**：正整数；首屏1，页大小为实现参数未冻结，越界处理不得伪造应用。

#### 2

**state**：确认/更新

**行为**：当前会话/请求内生效，不变更已保存业务事实。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：正整数；首屏1，页大小为实现参数未冻结，越界处理不得伪造应用。

**dependencies**



**保存**

**kind**：transient

**保存时机**：仅当前交互/请求中持有；取消/输入版本变化失效，不作为持久业务真相。

**来源**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/project-facts.json

**business_rule_ids**

1. BR-020

**示例**

**valid**

1. 按“分页查询”及本字段格式填写/取得合成列表页码

**invalid**

1. 缺必需列表页码、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-017

2. CHECK-044

3. CHECK-045

4. CHECK-053

5. CHECK-054

6. CHECK-055

7. CHECK-056

8. CHECK-057

9. CHECK-058

**historical_source_refs**

1. memory/business-rules.json#BR-020

**来源映射**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-009 应用查询总数

**标识**：DFIELD-009

**名称**：应用查询总数

**entity**：ApplicationList

**存储语义键**：total

**类型**：integer

**格式**：非负，真实空为0，查询失败不能显示0冒充无数据。

**允许为空**：False

**必填条件**：查询成功

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 非负，真实空为0，查询失败不能显示0冒充无数据。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 超管

**write**

1. 超管当前查询交互

**生命周期**

#### 1

**state**：输入/接收

**行为**：非负，真实空为0，查询失败不能显示0冒充无数据。

#### 2

**state**：确认/更新

**行为**：当前会话/请求内生效，不变更已保存业务事实。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：非负，真实空为0，查询失败不能显示0冒充无数据。

**dependencies**



**保存**

**kind**：transient

**保存时机**：仅当前交互/请求中持有；取消/输入版本变化失效，不作为持久业务真相。

**来源**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/project-facts.json

**business_rule_ids**

1. BR-020

**示例**

**valid**

1. 按“查询成功”及本字段格式填写/取得合成应用查询总数

**invalid**

1. 缺必需应用查询总数、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-017

2. CHECK-044

3. CHECK-045

4. CHECK-053

5. CHECK-054

6. CHECK-055

7. CHECK-056

8. CHECK-057

9. CHECK-058

**historical_source_refs**

1. memory/business-rules.json#BR-020

**来源映射**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-010 验真租户

**标识**：DFIELD-010

**名称**：验真租户

**entity**：Identity

**存储语义键**：tenantId

**类型**：string

**格式**：获取token时显式tenantId为提案；验应用有效关联后身份固定该租户。后续body/task/seat须一致；缺失/无关联/跨租户拒绝，不默认首个或最近租户。手工UI沿现有登录租户。

**允许为空**：False

**必填条件**：每次请求/操作

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 获取token时显式tenantId为提案；验应用有效关联后身份固定该租户。后续body/task/seat须一致；缺失/无关联/跨租户拒绝，不默认首个或最近租户。手工UI沿现有登录租户。

2. 不以默认值、显示名或历史最近值补齐真实关联；未适用字段不伪造。

**权限**

**read**

1. 认证服务和当前获授权调用方；凭证不在普通运营页暴露

**write**

1. 现有认证/授权服务，生产方案待核

**生命周期**

#### 1

**state**：输入/接收

**行为**：获取token时显式tenantId为提案；验应用有效关联后身份固定该租户。后续body/task/seat须一致；缺失/无关联/跨租户拒绝，不默认首个或最近租户。手工UI沿现有登录租户。

#### 2

**state**：确认/更新

**行为**：当前会话/请求内生效，不变更已保存业务事实。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：获取token时显式tenantId为提案；验应用有效关联后身份固定该租户。后续body/task/seat须一致；缺失/无关联/跨租户拒绝，不默认首个或最近租户。手工UI沿现有登录租户。

**dependencies**



**保存**

**kind**：transient

**保存时机**：仅当前交互/请求中持有；取消/输入版本变化失效，不作为持久业务真相。

**来源**：memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-080, memory/normalized-user-stories.json#AC-092, memory/project-facts.json

**business_rule_ids**

1. BR-001

2. BR-016

**示例**

**valid**

1. 按“每次请求/操作”及本字段格式填写/取得合成验真租户

**invalid**

1. 缺必需验真租户、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-045

2. CHECK-080

3. CHECK-092

**historical_source_refs**

1. memory/business-rules.json#BR-001

2. memory/business-rules.json#BR-016

**来源映射**：memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-080, memory/normalized-user-stories.json#AC-092, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-011 验真接入应用

**标识**：DFIELD-011

**名称**：验真接入应用

**entity**：Identity

**存储语义键**：stableAppId

**类型**：string

**格式**：认证上下文稳定app；每个业务系统自己的应用，可服务多个租户；报文source仅一致性校验，不能切app/tenant/回调。手工UI无应用保空。

**允许为空**：True

**必填条件**：外部接收必须取得；手工可空

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 认证上下文稳定app；每个业务系统自己的应用，可服务多个租户；报文source仅一致性校验，不能切app/tenant/回调。手工UI无应用保空。

2. 不以默认值、显示名或历史最近值补齐真实关联；未适用字段不伪造。

**权限**

**read**

1. 认证服务和当前获授权调用方；凭证不在普通运营页暴露

**write**

1. 现有认证/授权服务，生产方案待核

**生命周期**

#### 1

**state**：输入/接收

**行为**：认证上下文稳定app；每个业务系统自己的应用，可服务多个租户；报文source仅一致性校验，不能切app/tenant/回调。手工UI无应用保空。

#### 2

**state**：确认/更新

**行为**：当前会话/请求内生效，不变更已保存业务事实。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：认证上下文稳定app；每个业务系统自己的应用，可服务多个租户；报文source仅一致性校验，不能切app/tenant/回调。手工UI无应用保空。

**dependencies**



**保存**

**kind**：transient

**保存时机**：仅当前交互/请求中持有；取消/输入版本变化失效，不作为持久业务真相。

**来源**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-092, memory/project-facts.json

**business_rule_ids**

1. BR-001

2. BR-016

3. BR-017

**示例**

**valid**

1. 按“外部接收必须取得；手工可空”及本字段格式填写/取得合成验真接入应用

**invalid**

1. 缺必需验真接入应用、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-017

2. CHECK-045

3. CHECK-047

4. CHECK-050

5. CHECK-092

**historical_source_refs**

1. memory/business-rules.json#BR-001

2. memory/business-rules.json#BR-016

3. memory/business-rules.json#BR-017

**来源映射**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-092, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-012 租户业务身份

**标识**：DFIELD-012

**名称**：租户业务身份

**entity**：Identity

**存储语义键**：token

**类型**：opaque string

**格式**：本方提案签发绑定stableApp+明确tenant业务身份；换租户另取token，不授管理/运营权限。TTL、解除关联及旧token失效仍待S4，不能用临时token值做幂等键。

**允许为空**：True

**必填条件**：外部接口必须有效

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 本方提案签发绑定stableApp+明确tenant业务身份；换租户另取token，不授管理/运营权限。TTL、解除关联及旧token失效仍待S4，不能用临时token值做幂等键。

2. 不以默认值、显示名或历史最近值补齐真实关联；未适用字段不伪造。

**权限**

**read**

1. 有权认证/密钥读取方；普通运营页面和日志不展示明文凭据

**write**

1. 现有认证/授权服务，生产方案待核

**生命周期**

#### 1

**state**：输入/接收

**行为**：本方提案签发绑定stableApp+明确tenant业务身份；换租户另取token，不授管理/运营权限。TTL、解除关联及旧token失效仍待S4，不能用临时token值做幂等键。

#### 2

**state**：确认/更新

**行为**：当前会话/请求内生效，不变更已保存业务事实。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：external

**rule**：本方提案签发绑定stableApp+明确tenant业务身份；换租户另取token，不授管理/运营权限。TTL、解除关联及旧token失效仍待S4，不能用临时token值做幂等键。

**dependencies**



**保存**

**kind**：transient

**保存时机**：仅当前交互/请求中持有；取消/输入版本变化失效，不作为持久业务真相。

**来源**：memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-092, memory/project-facts.json

**business_rule_ids**

1. BR-001

2. BR-016

3. BR-020

**示例**

**valid**

1. 按“外部接口必须有效”及本字段格式填写/取得合成租户业务身份

**invalid**

1. 缺必需租户业务身份、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-045

2. CHECK-056

3. CHECK-057

4. CHECK-092

**historical_source_refs**

1. memory/business-rules.json#BR-001

2. memory/business-rules.json#BR-016

3. memory/business-rules.json#BR-020

**来源映射**：memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-092, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-013 当前任务权限

**标识**：DFIELD-013

**名称**：当前任务权限

**entity**：Identity

**存储语义键**：taskPermission

**类型**：enum

**格式**：现有服务端授权判定允许/拒绝/未知；角色名称/按钮可见不是授权，未知不默认允许。

**允许为空**：True

**必填条件**：操作和外发前

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 现有服务端授权判定允许/拒绝/未知；角色名称/按钮可见不是授权，未知不默认允许。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 认证服务和当前获授权调用方；凭证不在普通运营页暴露

**write**

1. 现有认证/授权服务，生产方案待核

**生命周期**

#### 1

**state**：输入/接收

**行为**：现有服务端授权判定允许/拒绝/未知；角色名称/按钮可见不是授权，未知不默认允许。

#### 2

**state**：确认/更新

**行为**：当前会话/请求内生效，不变更已保存业务事实。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：现有服务端授权判定允许/拒绝/未知；角色名称/按钮可见不是授权，未知不默认允许。

**dependencies**



**保存**

**kind**：transient

**保存时机**：仅当前交互/请求中持有；取消/输入版本变化失效，不作为持久业务真相。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-007

2. BR-016

3. BR-022

**示例**

**valid**

1. 按“操作和外发前”及本字段格式填写/取得合成当前任务权限

**invalid**

1. 缺必需当前任务权限、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-004

3. CHECK-005

4. CHECK-006

5. CHECK-007

6. CHECK-009

7. CHECK-010

8. CHECK-012

9. CHECK-014

10. CHECK-015

11. CHECK-016

12. CHECK-017

13. CHECK-018

14. CHECK-019

15. CHECK-020

16. CHECK-023

17. CHECK-024

18. CHECK-025

19. CHECK-026

20. CHECK-027

21. CHECK-028

22. CHECK-029

23. CHECK-030

24. CHECK-031

25. CHECK-032

26. CHECK-035

27. CHECK-036

28. CHECK-037

29. CHECK-038

30. CHECK-039

31. CHECK-040

32. CHECK-041

33. CHECK-042

34. CHECK-043

35. CHECK-045

36. CHECK-047

37. CHECK-048

38. CHECK-049

39. CHECK-050

40. CHECK-051

41. CHECK-052

42. CHECK-056

43. CHECK-057

44. CHECK-058

45. CHECK-059

46. CHECK-060

47. CHECK-061

48. CHECK-063

49. CHECK-064

50. CHECK-065

51. CHECK-066

52. CHECK-067

53. CHECK-068

54. CHECK-069

55. CHECK-070

56. CHECK-071

57. CHECK-072

58. CHECK-073

59. CHECK-074

60. CHECK-075

61. CHECK-076

62. CHECK-077

63. CHECK-078

64. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-007

2. memory/business-rules.json#BR-016

3. memory/business-rules.json#BR-022

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-014 任务所属租户

**标识**：DFIELD-014

**名称**：任务所属租户

**entity**：Task

**存储语义键**：tenantId

**类型**：string

**格式**：创建保存并锁定，记录与实际请求不跨租户混用。

**允许为空**：False

**必填条件**：任务创建/全部操作

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 创建保存并锁定，记录与实际请求不跨租户混用。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：创建保存并锁定，记录与实际请求不跨租户混用。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：创建保存并锁定，记录与实际请求不跨租户混用。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-001

2. BR-016

**示例**

**valid**

1. 按“任务创建/全部操作”及本字段格式填写/取得合成任务所属租户

**invalid**

1. 缺必需任务所属租户、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-004

3. CHECK-005

4. CHECK-006

5. CHECK-007

6. CHECK-009

7. CHECK-010

8. CHECK-012

9. CHECK-014

10. CHECK-015

11. CHECK-017

12. CHECK-018

13. CHECK-019

14. CHECK-020

15. CHECK-023

16. CHECK-025

17. CHECK-026

18. CHECK-027

19. CHECK-028

20. CHECK-029

21. CHECK-030

22. CHECK-031

23. CHECK-032

24. CHECK-035

25. CHECK-036

26. CHECK-037

27. CHECK-038

28. CHECK-039

29. CHECK-040

30. CHECK-041

31. CHECK-042

32. CHECK-043

33. CHECK-044

34. CHECK-045

35. CHECK-047

36. CHECK-048

37. CHECK-049

38. CHECK-050

39. CHECK-051

40. CHECK-052

41. CHECK-053

42. CHECK-054

43. CHECK-055

44. CHECK-056

45. CHECK-057

46. CHECK-058

47. CHECK-059

48. CHECK-060

49. CHECK-063

50. CHECK-064

51. CHECK-065

52. CHECK-066

53. CHECK-067

54. CHECK-068

55. CHECK-069

56. CHECK-070

57. CHECK-071

58. CHECK-072

59. CHECK-073

60. CHECK-074

61. CHECK-075

62. CHECK-076

63. CHECK-077

64. CHECK-078

65. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-001

2. memory/business-rules.json#BR-016

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-015 原供应商任务号

**标识**：DFIELD-015

**名称**：原供应商任务号

**entity**：Task

**存储语义键**：supplierTaskId

**类型**：supplier identifier

**格式**：仅预测分支需准确原供应商taskId并核token租户，不猜本地任务映射；人工分配无此字段且不伪造，预测转人工仅原始溯源保留。

**允许为空**：True

**必填条件**：预外呼导入/预测结果/精准删除；人工新导入不适用

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 仅预测分支需准确原供应商taskId并核token租户，不猜本地任务映射；人工分配无此字段且不伪造，预测转人工仅原始溯源保留。

2. 不以默认值、显示名或历史最近值补齐真实关联；未适用字段不伪造。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：仅预测分支需准确原供应商taskId并核token租户，不猜本地任务映射；人工分配无此字段且不伪造，预测转人工仅原始溯源保留。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：仅预测分支需准确原供应商taskId并核token租户，不猜本地任务映射；人工分配无此字段且不伪造，预测转人工仅原始溯源保留。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-089, memory/project-facts.json

**business_rule_ids**

1. BR-002

2. BR-004

3. BR-012

4. BR-016

**示例**

**valid**

1. 按“导入/结果/删除”及本字段格式填写/取得合成原供应商任务号

**invalid**

1. 缺必需原供应商任务号、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-012

2. CHECK-023

3. CHECK-036

4. CHECK-082

5. CHECK-089

**historical_source_refs**

1. memory/business-rules.json#BR-002

2. memory/business-rules.json#BR-004

3. memory/business-rules.json#BR-012

4. memory/business-rules.json#BR-016

**来源映射**：memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-089, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**interface_note**：对外导入草案taskId映射本字段原供应商任务ID（supplierTaskId），预外呼分支必填并核token租户/权限/任务有效性；人工分支不要求、不伪造。不得另解释为本地平台任务ID；正式字段名与协议仍待S4。

#### DFIELD-016 初始导入方式

**标识**：DFIELD-016

**名称**：初始导入方式

**entity**：Task

**存储语义键**：importMode

**类型**：enum

**格式**：仅预外呼任务的初始导入来源：外部接口/手工UI二选，提交后锁定。接口允许该租户有效关联应用；不等于外呼方式callMode，不迁改历史来源。

**允许为空**：False

**必填条件**：创建任务时

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 仅预外呼任务的初始导入来源：外部接口/手工UI二选，提交后锁定。接口允许该租户有效关联应用；不等于外呼方式callMode，不迁改历史来源。

2. 不以默认值、显示名或历史最近值补齐真实关联；未适用字段不伪造。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：仅预外呼任务的初始导入来源：外部接口/手工UI二选，提交后锁定。接口允许该租户有效关联应用；不等于外呼方式callMode，不迁改历史来源。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：仅预外呼任务的初始导入来源：外部接口/手工UI二选，提交后锁定。接口允许该租户有效关联应用；不等于外呼方式callMode，不迁改历史来源。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-072, memory/project-facts.json

**business_rule_ids**

1. BR-014

2. BR-016

**示例**

**valid**

1. 按“创建任务时”及本字段格式填写/取得合成初始导入方式

**invalid**

1. 缺必需初始导入方式、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-029

2. CHECK-036

3. CHECK-059

4. CHECK-072

**historical_source_refs**

1. memory/business-rules.json#BR-014

2. memory/business-rules.json#BR-016

**来源映射**：memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-072, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-017 任务状态

**标识**：DFIELD-017

**名称**：任务状态

**entity**：Task

**存储语义键**：lifecycle

**类型**：enum

**格式**：沿现有状态；初始历史补导只沿未启动规则。暂停挂起、恢复重核、终止停止未执行计划；供应商运行受理矩阵待核。

**允许为空**：True

**必填条件**：初始导入/失败执行

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 沿现有状态；初始历史补导只沿未启动规则。暂停挂起、恢复重核、终止停止未执行计划；供应商运行受理矩阵待核。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：沿现有状态；初始历史补导只沿未启动规则。暂停挂起、恢复重核、终止停止未执行计划；供应商运行受理矩阵待核。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：沿现有状态；初始历史补导只沿未启动规则。暂停挂起、恢复重核、终止停止未执行计划；供应商运行受理矩阵待核。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-007

2. BR-009

3. BR-016

4. BR-022

**示例**

**valid**

1. 按“初始导入/失败执行”及本字段格式填写/取得合成任务状态

**invalid**

1. 缺必需任务状态、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-009

9. CHECK-010

10. CHECK-012

11. CHECK-014

12. CHECK-015

13. CHECK-016

14. CHECK-017

15. CHECK-018

16. CHECK-019

17. CHECK-020

18. CHECK-023

19. CHECK-024

20. CHECK-025

21. CHECK-026

22. CHECK-027

23. CHECK-028

24. CHECK-029

25. CHECK-030

26. CHECK-031

27. CHECK-032

28. CHECK-033

29. CHECK-035

30. CHECK-036

31. CHECK-037

32. CHECK-038

33. CHECK-039

34. CHECK-040

35. CHECK-041

36. CHECK-042

37. CHECK-043

38. CHECK-045

39. CHECK-047

40. CHECK-048

41. CHECK-049

42. CHECK-050

43. CHECK-051

44. CHECK-052

45. CHECK-056

46. CHECK-057

47. CHECK-058

48. CHECK-059

49. CHECK-060

50. CHECK-061

51. CHECK-062

52. CHECK-063

53. CHECK-064

54. CHECK-065

55. CHECK-066

56. CHECK-067

57. CHECK-068

58. CHECK-069

59. CHECK-070

60. CHECK-071

61. CHECK-072

62. CHECK-073

63. CHECK-074

64. CHECK-075

65. CHECK-076

66. CHECK-077

67. CHECK-078

68. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-007

2. memory/business-rules.json#BR-009

3. memory/business-rules.json#BR-016

4. memory/business-rules.json#BR-022

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-018 正常任务重呼规则

**标识**：DFIELD-018

**名称**：正常任务重呼规则

**entity**：Task

**存储语义键**：retryPolicy

**类型**：object

**格式**：三天五呼只计配置状态触发；过频仅AliCti原生规则。三天起算/五呼是否含首次/跨子批/模式适用待核，不能拿失败两次代替。

**允许为空**：True

**必填条件**：正常任务配置

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 三天五呼只计配置状态触发；过频仅AliCti原生规则。三天起算/五呼是否含首次/跨子批/模式适用待核，不能拿失败两次代替。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：三天五呼只计配置状态触发；过频仅AliCti原生规则。三天起算/五呼是否含首次/跨子批/模式适用待核，不能拿失败两次代替。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：三天五呼只计配置状态触发；过频仅AliCti原生规则。三天起算/五呼是否含首次/跨子批/模式适用待核，不能拿失败两次代替。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-008

2. BR-013

**示例**

**valid**

1. 按“正常任务配置”及本字段格式填写/取得合成正常任务重呼规则

**invalid**

1. 缺必需正常任务重呼规则、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-002

2. CHECK-003

3. CHECK-004

4. CHECK-008

5. CHECK-011

6. CHECK-012

7. CHECK-013

8. CHECK-014

9. CHECK-015

10. CHECK-016

11. CHECK-018

12. CHECK-019

13. CHECK-020

14. CHECK-023

15. CHECK-024

16. CHECK-025

17. CHECK-026

18. CHECK-027

19. CHECK-028

20. CHECK-029

21. CHECK-031

22. CHECK-032

23. CHECK-033

24. CHECK-035

25. CHECK-036

26. CHECK-037

27. CHECK-038

28. CHECK-039

29. CHECK-040

30. CHECK-041

31. CHECK-042

32. CHECK-043

33. CHECK-046

34. CHECK-052

35. CHECK-059

36. CHECK-061

37. CHECK-062

38. CHECK-063

39. CHECK-064

40. CHECK-065

41. CHECK-066

42. CHECK-067

43. CHECK-068

44. CHECK-070

45. CHECK-071

46. CHECK-072

47. CHECK-073

48. CHECK-074

49. CHECK-075

50. CHECK-076

51. CHECK-077

52. CHECK-078

53. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-008

2. memory/business-rules.json#BR-013

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-019 外部请求号

**标识**：DFIELD-019

**名称**：外部请求号

**entity**：ExternalRequest

**存储语义键**：requestId

**类型**：string

**格式**：一次可多行，新业务用新ID；同app域同ID同完整内容重放原逐行回执，异内容拒整个重复请求；正式长度/保留期/兼容待核。

**允许为空**：False

**必填条件**：每个外部请求

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 一次可多行，新业务用新ID；同app域同ID同完整内容重放原逐行回执，异内容拒整个重复请求；正式长度/保留期/兼容待核。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：请求进入

**行为**：先验当前身份/归属，再查本app请求作用域，不返回他app回执。

#### 2

**state**：新请求准确落账

**行为**：请求内容、有效行实际映射与坏行回执一致保存；落账未确认不伪返回编号。

#### 3

**state**：技术重传/冲突

**行为**：同ID同内容读原值，异内容拒绝；后来新主不重算旧root。

**派生规则**

**kind**：input

**rule**：一次可多行，新业务用新ID；同app域同ID同完整内容重放原逐行回执，异内容拒整个重复请求；正式长度/保留期/兼容待核。

**dependencies**



**保存**

**kind**：stored

**保存时机**：当前认证/稳定app/tenant任务模式校验后，在新请求原子接收过程中保存规范化内容、行定位及原逐行回执；同作用域重传读取原事实，不改写原映射。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-002

2. BR-012

3. BR-015

**示例**

**valid**

1. 按“每个外部请求”及本字段格式填写/取得合成外部请求号

**invalid**

1. 缺必需外部请求号、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-002

2. memory/business-rules.json#BR-012

3. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-020 请求作用域

**标识**：DFIELD-020

**名称**：请求作用域

**entity**：ExternalRequest

**存储语义键**：namespace

**类型**：tuple

**格式**：建议tenant+stableApp+operation+requestId；跨租户或跨app独立，同app换token不改变原租户作用域；source不能切作用域；正式键/历史兼容待S4。

**允许为空**：False

**必填条件**：查重前

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 建议tenant+stableApp+operation+requestId；跨租户或跨app独立，同app换token不改变原租户作用域；source不能切作用域；正式键/历史兼容待S4。

2. 不以默认值、显示名或历史最近值补齐真实关联；未适用字段不伪造。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：请求进入

**行为**：建议tenant+stableApp+operation+requestId；跨租户或跨app独立，同app换token不改变原租户作用域；source不能切作用域；正式键/历史兼容待S4。

#### 2

**state**：新请求准确落账

**行为**：请求内容、有效行实际映射与坏行回执一致保存；落账未确认不伪返回编号。

#### 3

**state**：技术重传/冲突

**行为**：同ID同内容读原值，异内容拒绝；后来新主不重算旧root。

**派生规则**

**kind**：calculated

**rule**：建议tenant+stableApp+operation+requestId；跨租户或跨app独立，同app换token不改变原租户作用域；source不能切作用域；正式键/历史兼容待S4。

**dependencies**

1. DFIELD-010

2. DFIELD-011

3. DFIELD-019

**保存**

**kind**：stored

**保存时机**：当前认证/稳定app/tenant任务模式校验后，在新请求原子接收过程中保存规范化内容、行定位及原逐行回执；同作用域重传读取原事实，不改写原映射。

**来源**：memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-083, memory/normalized-user-stories.json#AC-092, memory/project-facts.json

**business_rule_ids**

1. BR-002

2. BR-012

3. BR-015

**示例**

**valid**

1. 按“查重前”及本字段格式填写/取得合成请求作用域

**invalid**

1. 缺必需请求作用域、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-050

2. CHECK-051

3. CHECK-083

4. CHECK-092

**historical_source_refs**

1. memory/business-rules.json#BR-002

2. memory/business-rules.json#BR-012

3. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-083, memory/normalized-user-stories.json#AC-092, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-021 完整归一请求

**标识**：DFIELD-021

**名称**：完整归一请求

**entity**：ExternalRequest

**存储语义键**：normalizedContent

**类型**：object

**格式**：比较callMode、实际taskId或人工工号、行定位、lead/phone/priority/R及保留source一致性字段等有效内容。仅预测missing isNewBatch归false；人工不注入预测字段。完整归一规则待S4。

**允许为空**：False

**必填条件**：查重前

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 比较callMode、实际taskId或人工工号、行定位、lead/phone/priority/R及保留source一致性字段等有效内容。仅预测missing isNewBatch归false；人工不注入预测字段。完整归一规则待S4。

2. 不以默认值、显示名或历史最近值补齐真实关联；未适用字段不伪造。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：请求进入

**行为**：比较callMode、实际taskId或人工工号、行定位、lead/phone/priority/R及保留source一致性字段等有效内容。仅预测missing isNewBatch归false；人工不注入预测字段。完整归一规则待S4。

#### 2

**state**：新请求准确落账

**行为**：请求内容、有效行实际映射与坏行回执一致保存；落账未确认不伪返回编号。

#### 3

**state**：技术重传/冲突

**行为**：同ID同内容读原值，异内容拒绝；后来新主不重算旧root。

**派生规则**

**kind**：input

**rule**：比较callMode、实际taskId或人工工号、行定位、lead/phone/priority/R及保留source一致性字段等有效内容。仅预测missing isNewBatch归false；人工不注入预测字段。完整归一规则待S4。

**dependencies**



**保存**

**kind**：stored

**保存时机**：当前认证/稳定app/tenant任务模式校验后，在新请求原子接收过程中保存规范化内容、行定位及原逐行回执；同作用域重传读取原事实，不改写原映射。

**来源**：memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-083, memory/project-facts.json

**business_rule_ids**

1. BR-002

2. BR-012

3. BR-015

**示例**

**valid**

1. 按“查重前”及本字段格式填写/取得合成完整归一请求

**invalid**

1. 缺必需完整归一请求、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-050

2. CHECK-051

3. CHECK-083

**historical_source_refs**

1. memory/business-rules.json#BR-002

2. memory/business-rules.json#BR-012

3. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-083, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-022 请求内行定位

**标识**：DFIELD-022

**名称**：请求内行定位

**entity**：ExternalRow

**存储语义键**：rowId

**类型**：string or integer

**格式**：同请求内稳定唯一，类型/旧调用兼容待定；处理后排序不能重编已有行定位。

**允许为空**：False

**必填条件**：逐行接收/回执

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 同请求内稳定唯一，类型/旧调用兼容待定；处理后排序不能重编已有行定位。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：请求进入

**行为**：先验当前身份/归属，再查本app请求作用域，不返回他app回执。

#### 2

**state**：新请求准确落账

**行为**：请求内容、有效行实际映射与坏行回执一致保存；落账未确认不伪返回编号。

#### 3

**state**：技术重传/冲突

**行为**：同ID同内容读原值，异内容拒绝；后来新主不重算旧root。

**派生规则**

**kind**：input

**rule**：同请求内稳定唯一，类型/旧调用兼容待定；处理后排序不能重编已有行定位。

**dependencies**



**保存**

**kind**：stored

**保存时机**：当前认证/稳定app/tenant任务模式校验后，在新请求原子接收过程中保存规范化内容、行定位及原逐行回执；同作用域重传读取原事实，不改写原映射。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-002

2. BR-012

**示例**

**valid**

1. 按“逐行接收/回执”及本字段格式填写/取得合成请求内行定位

**invalid**

1. 缺必需请求内行定位、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-004

4. CHECK-005

5. CHECK-006

6. CHECK-007

7. CHECK-009

8. CHECK-010

9. CHECK-011

10. CHECK-012

11. CHECK-013

12. CHECK-014

13. CHECK-015

14. CHECK-016

15. CHECK-017

16. CHECK-018

17. CHECK-019

18. CHECK-020

19. CHECK-021

20. CHECK-022

21. CHECK-023

22. CHECK-024

23. CHECK-025

24. CHECK-026

25. CHECK-027

26. CHECK-028

27. CHECK-029

28. CHECK-030

29. CHECK-031

30. CHECK-032

31. CHECK-034

32. CHECK-035

33. CHECK-036

34. CHECK-037

35. CHECK-038

36. CHECK-039

37. CHECK-040

38. CHECK-041

39. CHECK-042

40. CHECK-043

41. CHECK-045

42. CHECK-046

43. CHECK-047

44. CHECK-048

45. CHECK-049

46. CHECK-050

47. CHECK-051

48. CHECK-052

49. CHECK-056

50. CHECK-057

51. CHECK-058

52. CHECK-059

53. CHECK-060

54. CHECK-061

55. CHECK-062

56. CHECK-063

57. CHECK-064

58. CHECK-065

59. CHECK-066

60. CHECK-067

61. CHECK-068

62. CHECK-069

63. CHECK-070

64. CHECK-071

65. CHECK-072

66. CHECK-073

67. CHECK-074

68. CHECK-075

69. CHECK-076

70. CHECK-077

71. CHECK-078

72. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-002

2. memory/business-rules.json#BR-012

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-023 逐行接收回执

**标识**：DFIELD-023

**名称**：逐行接收回执

**entity**：ExternalRow

**存储语义键**：receipt

**类型**：object

**格式**：按实际方式保存本行成功/拒绝/待核及真实映射：预外呼record/batch/root；人工真实客户/record/assignment及分配状态，不生成预测task/batch/root/fileId。坏行不造编号，技术重传返原映射；接收或分配成功不等拨打/接通。

**允许为空**：False

**必填条件**：请求落账后

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 按实际方式保存本行成功/拒绝/待核及真实映射：预外呼record/batch/root；人工真实客户/record/assignment及分配状态，不生成预测task/batch/root/fileId。坏行不造编号，技术重传返原映射；接收或分配成功不等拨打/接通。

2. 必须遵守原app/当前明确tenant归属；缺失与不适用分别保留，不猜配或伪造。

**权限**

**read**

1. 授权原应用/当前租户业务范围；人工实际分配坐席及服务端，预测沿任务查看权限

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：接收/关联

**行为**：按实际方式保存本行成功/拒绝/待核及真实映射：预外呼record/batch/root；人工真实客户/record/assignment及分配状态，不生成预测task/batch/root/fileId。坏行不造编号，技术重传返原映射；接收或分配成功不等拨打/接通。

#### 2

**state**：保存成功

**行为**：当前app/明确tenant/回调配置、外呼方式及分支对象校验后，在新请求原子接收过程中保存真实行映射及回执；人工保存与分配结果未知如实保待确认，同作用域重传不新客户/派发/批次。

#### 3

**state**：拒绝/未知/重传

**行为**：拒绝不生成后续业务；未知保原对象和证据；技术重传返回同一对象，不新增客户/分配/批次/通话。

**派生规则**

**kind**：system

**rule**：按实际方式保存本行成功/拒绝/待核及真实映射：预外呼record/batch/root；人工真实客户/record/assignment及分配状态，不生成预测task/batch/root/fileId。坏行不造编号，技术重传返原映射；接收或分配成功不等拨打/接通。

**dependencies**



**保存**

**kind**：stored

**保存时机**：当前app/明确tenant/回调配置、外呼方式及分支对象校验后，在新请求原子接收过程中保存真实行映射及回执；人工保存与分配结果未知如实保待确认，同作用域重传不新客户/派发/批次。

**来源**：memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-080, memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-083, memory/normalized-user-stories.json#AC-086, memory/project-facts.json

**business_rule_ids**

1. BR-002

2. BR-004

3. BR-012

**示例**

**valid**

1. 人工有效导入只返回真实客户/分配并保存原编码号码；预测按真实task/file/batch保存。

**invalid**

1. 给人工记录补造预测task/fileId/root，或跨租户按同号猜配：拒绝并保原对象。

**验证引用**

1. CHECK-007

2. CHECK-047

3. CHECK-050

4. CHECK-051

5. CHECK-080

6. CHECK-082

7. CHECK-083

8. CHECK-086

**historical_source_refs**

1. memory/business-rules.json#BR-002

2. memory/business-rules.json#BR-004

3. memory/business-rules.json#BR-012

**来源映射**：memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-080, memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-083, memory/normalized-user-stories.json#AC-086, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-024 业务类型

**标识**：DFIELD-024

**名称**：业务类型

**entity**：ImportRecord

**存储语义键**：businessType

**类型**：string

**格式**：当前验真租户已启用业务类型的稳定编码；名称仅用于显示，不作为API传值。

**允许为空**：False

**必填条件**：新业务接口导入请求级必填；原手工基础信息选择保持

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。

2. 在当前身份/授权复核后，先按原幂等作用域核完整请求内容；businessType纳入内容比较但不新增幂等命名空间。同requestId改类型是内容冲突；已受理同内容技术重放只读返回原回执、不再新增，即使该类型后来停用也不改写已受理记录。不因改类型改变原leadCode/手机号归组、主子批或共享失败累计键。

3. 每条成功接收记录固化本次原businessType稳定码及当时显示名称，准确关联原app/tenant/request/row/record与本call；历史缺失不批量补值，不按最近同号、来源或外呼方式猜类型。后续名称/启停配置变化不改原类型码或来源快照。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 原初始导入权限人员提交前编辑或已认证外部应用提供；最终保存后业务字段按规则锁定

**生命周期**

#### 1

**state**：接收新业务

**行为**：请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。

#### 2

**state**：技术重放

**行为**：在当前身份/授权复核后，先按原幂等作用域核完整请求内容；businessType纳入内容比较但不新增幂等命名空间。同requestId改类型是内容冲突；已受理同内容技术重放只读返回原回执、不再新增，即使该类型后来停用也不改写已受理记录。不因改类型改变原leadCode/手机号归组、主子批或共享失败累计键。

#### 3

**state**：保存与展示

**行为**：每条成功接收记录固化本次原businessType稳定码及当时显示名称，准确关联原app/tenant/request/row/record与本call；历史缺失不批量补值，不按最近同号、来源或外呼方式猜类型。后续名称/启停配置变化不改原类型码或来源快照。 客户名单和详情显示本次保存的业务类型名称，详情保留其编码；坐席跟进按本条原类型自动使用对应业务表单，来源类型只读，不按其他同手机号记录或应用来源重选。历史无值显示未提供并保持原处理边界；已停用/无法解析的表单保留原值并明确待处理，不偷偷换成其他业务类型。原手工弹窗仍使用既有业务类型选择，不增加逐行CSV必填列。

#### 4

**state**：结果回调

**行为**：每次结果/进度及已完成沟通回调均携准确原app/tenant/record/call导入时保存的businessType稳定码和既有businessBatchNo；补送沿原事件快照。类型后续改名或停用不重算原码，历史未知不猜值，不只回传类型名称，也不替代已填字段/选项业务编码。正式回调报文与ACK仍待契约及工程验证。

**派生规则**

**kind**：input

**rule**：接口请求原业务类型码通过验真租户配置校验后逐条固化；手工沿原选择，无来源推断或默认值。

**dependencies**



**保存**

**kind**：stored

**保存时机**：接口新请求通过当前租户类型校验后，与每条成功导入记录保存原businessType码和当时名称；原手工最终确认按既有选择保存。技术重放不写新记录，历史缺失不回填。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json, inputs/source-index.json#SRC-125, memory/normalized-user-stories.json#AC-102, memory/normalized-user-stories.json#AC-103, memory/normalized-user-stories.json#AC-104

**business_rule_ids**

1. BR-003

2. BR-014

**示例**

**valid**

1. 同租户启用的两个不同类型分别用新requestId导入，可以复用businessBatchNo；回调分别保留各自原类型码。

2. 已受理同请求技术重放时类型已停用，仍只返回原回执且不新增客户。

**invalid**

1. 未传类型、传显示名称代替稳定码、传他租户类型或停用类型发起新业务，整次拒收。

2. 原requestId改变businessType，返回内容冲突且不改原记录。

**验证引用**

1. CHECK-001

2. CHECK-004

3. CHECK-005

4. CHECK-006

5. CHECK-007

6. CHECK-009

7. CHECK-010

8. CHECK-011

9. CHECK-012

10. CHECK-013

11. CHECK-014

12. CHECK-015

13. CHECK-017

14. CHECK-019

15. CHECK-020

16. CHECK-023

17. CHECK-025

18. CHECK-026

19. CHECK-027

20. CHECK-028

21. CHECK-029

22. CHECK-030

23. CHECK-031

24. CHECK-032

25. CHECK-035

26. CHECK-036

27. CHECK-038

28. CHECK-039

29. CHECK-040

30. CHECK-041

31. CHECK-042

32. CHECK-043

33. CHECK-045

34. CHECK-046

35. CHECK-047

36. CHECK-048

37. CHECK-049

38. CHECK-050

39. CHECK-051

40. CHECK-052

41. CHECK-056

42. CHECK-057

43. CHECK-058

44. CHECK-059

45. CHECK-060

46. CHECK-063

47. CHECK-064

48. CHECK-065

49. CHECK-066

50. CHECK-067

51. CHECK-068

52. CHECK-069

53. CHECK-070

54. CHECK-072

55. CHECK-073

56. CHECK-074

57. CHECK-076

58. CHECK-077

59. CHECK-078

60. CHECK-079

61. CHECK-102

62. CHECK-103

63. CHECK-104

**historical_source_refs**

1. memory/business-rules.json#BR-003

2. memory/business-rules.json#BR-014

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json, inputs/source-index.json#SRC-125, memory/normalized-user-stories.json#AC-102, memory/normalized-user-stories.json#AC-103, memory/normalized-user-stories.json#AC-104

**状态**：current_draft_definition_not_formal_contract

**business_type_contract**

**存储语义键**：businessType

**field_ref**：DFIELD-024

**级别**：request

**required**：True

**wire_type**：string_code

**one_type_per_request**：True

**authority**：authenticated_token_tenant_enabled_stable_business_type_code

**new_request_validation**：请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。

**idempotency**：在当前身份/授权复核后，先按原幂等作用域核完整请求内容；businessType纳入内容比较但不新增幂等命名空间。同requestId改类型是内容冲突；已受理同内容技术重放只读返回原回执、不再新增，即使该类型后来停用也不改写已受理记录。不因改类型改变原leadCode/手机号归组、主子批或共享失败累计键。

**persist**：每条成功接收记录固化本次原businessType稳定码及当时显示名称，准确关联原app/tenant/request/row/record与本call；历史缺失不批量补值，不按最近同号、来源或外呼方式猜类型。后续名称/启停配置变化不改原类型码或来源快照。

**display_and_form**：客户名单和详情显示本次保存的业务类型名称，详情保留其编码；坐席跟进按本条原类型自动使用对应业务表单，来源类型只读，不按其他同手机号记录或应用来源重选。历史无值显示未提供并保持原处理边界；已停用/无法解析的表单保留原值并明确待处理，不偷偷换成其他业务类型。原手工弹窗仍使用既有业务类型选择，不增加逐行CSV必填列。

**callback**：每次结果/进度及已完成沟通回调均携准确原app/tenant/record/call导入时保存的businessType稳定码和既有businessBatchNo；补送沿原事件快照。类型后续改名或停用不重算原码，历史未知不猜值，不只回传类型名称，也不替代已填字段/选项业务编码。正式回调报文与ACK仍待契约及工程验证。

**classification_keys_unchanged**：True

**formal_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**来源**：inputs/source-index.json#SRC-125, memory/normalized-user-stories.json#AC-102, memory/normalized-user-stories.json#AC-103, memory/normalized-user-stories.json#AC-104

#### DFIELD-025 批次名称

**标识**：DFIELD-025

**名称**：批次名称

**entity**：ImportRecord

**存储语义键**：batchName

**类型**：string

**格式**：保留原批次名必填及原有校验，不从演示自行冻结新长度。必要基础信息变化使预览失效。

**允许为空**：False

**必填条件**：手工最终确认

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 保留原批次名必填及原有校验，不从演示自行冻结新长度。必要基础信息变化使预览失效。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 原初始导入权限人员提交前编辑或已认证外部应用提供；最终保存后业务字段按规则锁定

**生命周期**

#### 1

**state**：输入/接收

**行为**：保留原批次名必填及原有校验，不从演示自行冻结新长度。必要基础信息变化使预览失效。

#### 2

**state**：确认/更新

**行为**：最终当前名单确认时保存本次原基础信息；提交失败不伪造已保存数据。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：input

**rule**：保留原批次名必填及原有校验，不从演示自行冻结新长度。必要基础信息变化使预览失效。

**dependencies**



**保存**

**kind**：stored

**保存时机**：原弹窗填写时仅草稿；最终当前有效名单确认落账时随原客户记录保存本次业务类型/批次名称，不丢原基础信息。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**business_rule_ids**

1. BR-014

**示例**

**valid**

1. 按“手工最终确认”及本字段格式填写/取得合成批次名称

**invalid**

1. 缺必需批次名称、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-004

3. CHECK-005

4. CHECK-006

5. CHECK-007

6. CHECK-009

7. CHECK-010

8. CHECK-012

9. CHECK-014

10. CHECK-015

11. CHECK-017

12. CHECK-019

13. CHECK-025

14. CHECK-028

15. CHECK-029

16. CHECK-030

17. CHECK-031

18. CHECK-032

19. CHECK-036

20. CHECK-038

21. CHECK-039

22. CHECK-040

23. CHECK-041

24. CHECK-042

25. CHECK-043

26. CHECK-045

27. CHECK-047

28. CHECK-048

29. CHECK-049

30. CHECK-050

31. CHECK-051

32. CHECK-052

33. CHECK-056

34. CHECK-057

35. CHECK-058

36. CHECK-059

37. CHECK-060

38. CHECK-069

39. CHECK-070

40. CHECK-078

**historical_source_refs**

1. memory/business-rules.json#BR-014

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-026 当前CSV名单

**标识**：DFIELD-026

**名称**：当前CSV名单

**entity**：ManualDraft

**存储语义键**：csvText

**类型**：string

**格式**：保留原文件选择/粘贴编辑/检查；空文本可处于编辑态但不能提交空名单，文件编码/大小沿既有规则。

**允许为空**：False

**必填条件**：上传/粘贴/检查

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 保留原文件选择/粘贴编辑/检查；空文本可处于编辑态但不能提交空名单，文件编码/大小沿既有规则。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 原初始导入权限人员提交前编辑或已认证外部应用提供；最终保存后业务字段按规则锁定

**生命周期**

#### 1

**state**：输入/接收

**行为**：保留原文件选择/粘贴编辑/检查；空文本可处于编辑态但不能提交空名单，文件编码/大小沿既有规则。

#### 2

**state**：确认/更新

**行为**：当前会话/请求内生效，不变更已保存业务事实。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：input

**rule**：保留原文件选择/粘贴编辑/检查；空文本可处于编辑态但不能提交空名单，文件编码/大小沿既有规则。

**dependencies**



**保存**

**kind**：transient

**保存时机**：仅当前交互/请求中持有；取消/输入版本变化失效，不作为持久业务真相。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**business_rule_ids**

1. BR-014

**示例**

**valid**

1. 按“上传/粘贴/检查”及本字段格式填写/取得合成当前CSV名单

**invalid**

1. 缺必需当前CSV名单、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-004

3. CHECK-005

4. CHECK-006

5. CHECK-007

6. CHECK-009

7. CHECK-010

8. CHECK-012

9. CHECK-014

10. CHECK-015

11. CHECK-017

12. CHECK-019

13. CHECK-025

14. CHECK-028

15. CHECK-029

16. CHECK-030

17. CHECK-031

18. CHECK-032

19. CHECK-036

20. CHECK-038

21. CHECK-039

22. CHECK-040

23. CHECK-041

24. CHECK-042

25. CHECK-043

26. CHECK-045

27. CHECK-047

28. CHECK-048

29. CHECK-049

30. CHECK-050

31. CHECK-051

32. CHECK-052

33. CHECK-056

34. CHECK-057

35. CHECK-058

36. CHECK-059

37. CHECK-060

38. CHECK-069

39. CHECK-070

40. CHECK-078

**historical_source_refs**

1. memory/business-rules.json#BR-014

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-027 当前草稿版本

**标识**：DFIELD-027

**名称**：当前草稿版本

**entity**：ManualDraft

**存储语义键**：inputVersion

**类型**：stable version

**格式**：文件/文本/必要输入变化推进本版本；提交中锁定，落账前再次比对，具体版本编码待工程。

**允许为空**：False

**必填条件**：检查及提交

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 文件/文本/必要输入变化推进本版本；提交中锁定，落账前再次比对，具体版本编码待工程。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 原初始导入权限人员提交前编辑或已认证外部应用提供；最终保存后业务字段按规则锁定

**生命周期**

#### 1

**state**：输入/接收

**行为**：文件/文本/必要输入变化推进本版本；提交中锁定，落账前再次比对，具体版本编码待工程。

#### 2

**state**：确认/更新

**行为**：当前会话/请求内生效，不变更已保存业务事实。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：input

**rule**：文件/文本/必要输入变化推进本版本；提交中锁定，落账前再次比对，具体版本编码待工程。

**dependencies**



**保存**

**kind**：transient

**保存时机**：仅当前交互/请求中持有；取消/输入版本变化失效，不作为持久业务真相。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-014

2. BR-015

**示例**

**valid**

1. 按“检查及提交”及本字段格式填写/取得合成当前草稿版本

**invalid**

1. 缺必需当前草稿版本、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-014

2. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-028 当前有效预览

**标识**：DFIELD-028

**名称**：当前有效预览

**entity**：ManualDraft

**存储语义键**：preview

**类型**：object or null

**格式**：绑定当前草稿版本；可含待填priority行供统一/逐条编辑，换输入/检查失败/空结果清旧可提交预览；取消不提交。

**允许为空**：True

**必填条件**：检查后

**默认值**

**kind**：literal

**value**：待核／未提供

**rule**：新弹窗/输入变化/检查空或失败无有效预览。

**校验规则**

1. 绑定当前草稿版本；可含待填priority行供统一/逐条编辑，换输入/检查失败/空结果清旧可提交预览；取消不提交。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 原初始导入权限人员提交前编辑或已认证外部应用提供；最终保存后业务字段按规则锁定

**生命周期**

#### 1

**state**：输入/接收

**行为**：绑定当前草稿版本；可含待填priority行供统一/逐条编辑，换输入/检查失败/空结果清旧可提交预览；取消不提交。

#### 2

**state**：确认/更新

**行为**：当前会话/请求内生效，不变更已保存业务事实。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：input

**rule**：绑定当前草稿版本；可含待填priority行供统一/逐条编辑，换输入/检查失败/空结果清旧可提交预览；取消不提交。

**dependencies**



**保存**

**kind**：transient

**保存时机**：仅当前交互/请求中持有；取消/输入版本变化失效，不作为持久业务真相。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-014

2. BR-015

**示例**

**valid**

1. 按“检查后”及本字段格式填写/取得合成当前有效预览

**invalid**

1. 缺必需当前有效预览、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-014

2. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-029 客户称呼

**标识**：DFIELD-029

**名称**：客户称呼

**entity**：ImportRecord

**存储语义键**：customerName

**类型**：string

**格式**：原客户字段必须保留，校验沿既有规则；供应商name参数映射另待正式接口，不能改为技术编码。

**允许为空**：False

**必填条件**：手工最终确认

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 原客户字段必须保留，校验沿既有规则；供应商name参数映射另待正式接口，不能改为技术编码。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 原初始导入权限人员提交前编辑或已认证外部应用提供；最终保存后业务字段按规则锁定

**生命周期**

#### 1

**state**：输入/接收

**行为**：原客户字段必须保留，校验沿既有规则；供应商name参数映射另待正式接口，不能改为技术编码。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：input

**rule**：原客户字段必须保留，校验沿既有规则；供应商name参数映射另待正式接口，不能改为技术编码。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-003

2. BR-014

**示例**

**valid**

1. 按“手工最终确认”及本字段格式填写/取得合成客户称呼

**invalid**

1. 缺必需客户称呼、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-004

3. CHECK-005

4. CHECK-006

5. CHECK-007

6. CHECK-009

7. CHECK-010

8. CHECK-011

9. CHECK-012

10. CHECK-013

11. CHECK-014

12. CHECK-015

13. CHECK-017

14. CHECK-019

15. CHECK-020

16. CHECK-023

17. CHECK-025

18. CHECK-026

19. CHECK-027

20. CHECK-028

21. CHECK-029

22. CHECK-030

23. CHECK-031

24. CHECK-032

25. CHECK-035

26. CHECK-036

27. CHECK-038

28. CHECK-039

29. CHECK-040

30. CHECK-041

31. CHECK-042

32. CHECK-043

33. CHECK-045

34. CHECK-046

35. CHECK-047

36. CHECK-048

37. CHECK-049

38. CHECK-050

39. CHECK-051

40. CHECK-052

41. CHECK-056

42. CHECK-057

43. CHECK-058

44. CHECK-059

45. CHECK-060

46. CHECK-063

47. CHECK-064

48. CHECK-065

49. CHECK-066

50. CHECK-067

51. CHECK-068

52. CHECK-069

53. CHECK-070

54. CHECK-072

55. CHECK-073

56. CHECK-074

57. CHECK-076

58. CHECK-077

59. CHECK-078

60. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-003

2. memory/business-rules.json#BR-014

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-030 原编码兼容值

**标识**：DFIELD-030

**名称**：原编码兼容值

**entity**：ImportRecord

**存储语义键**：externalDocumentId

**类型**：string

**格式**：线索类新导入由同一leadCode输入兼容写入；不第二次输入业务编码。其他类型原单据字段/独立leadCode保持；旧双列同值兼容、冲突保留输入待修正，历史不批量回写。

**允许为空**：True

**必填条件**：按业务类型

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 线索类新导入由同一leadCode输入兼容写入；不第二次输入业务编码。其他类型原单据字段/独立leadCode保持；旧双列同值兼容、冲突保留输入待修正，历史不批量回写。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：线索类新导入由同一leadCode输入兼容写入；不第二次输入业务编码。其他类型原单据字段/独立leadCode保持；旧双列同值兼容、冲突保留输入待修正，历史不批量回写。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：calculated

**rule**：线索类新导入由同一leadCode输入兼容写入；不第二次输入业务编码。其他类型原单据字段/独立leadCode保持；旧双列同值兼容、冲突保留输入待修正，历史不批量回写。

**dependencies**

1. DFIELD-032

2. DFIELD-024

**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-003

2. BR-014

**示例**

**valid**

1. 按“按业务类型”及本字段格式填写/取得合成原编码兼容值

**invalid**

1. 缺必需原编码兼容值、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-004

3. CHECK-005

4. CHECK-006

5. CHECK-007

6. CHECK-009

7. CHECK-010

8. CHECK-011

9. CHECK-012

10. CHECK-013

11. CHECK-014

12. CHECK-015

13. CHECK-017

14. CHECK-019

15. CHECK-020

16. CHECK-023

17. CHECK-025

18. CHECK-026

19. CHECK-027

20. CHECK-028

21. CHECK-029

22. CHECK-030

23. CHECK-031

24. CHECK-032

25. CHECK-035

26. CHECK-036

27. CHECK-038

28. CHECK-039

29. CHECK-040

30. CHECK-041

31. CHECK-042

32. CHECK-043

33. CHECK-045

34. CHECK-046

35. CHECK-047

36. CHECK-048

37. CHECK-049

38. CHECK-050

39. CHECK-051

40. CHECK-052

41. CHECK-056

42. CHECK-057

43. CHECK-058

44. CHECK-059

45. CHECK-060

46. CHECK-063

47. CHECK-064

48. CHECK-065

49. CHECK-066

50. CHECK-067

51. CHECK-068

52. CHECK-069

53. CHECK-070

54. CHECK-072

55. CHECK-073

56. CHECK-074

57. CHECK-076

58. CHECK-077

59. CHECK-078

60. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-003

2. memory/business-rules.json#BR-014

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-031 联系备注

**标识**：DFIELD-031

**名称**：联系备注

**entity**：ImportRecord

**存储语义键**：contactNote

**类型**：string

**格式**：保留原备注，与R分开，放必填后；空值=未填，不能由备注推priority或来源；长度沿原规则待核。

**允许为空**：True

**必填条件**：手工可选

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 保留原备注，与R分开，放必填后；空值=未填，不能由备注推priority或来源；长度沿原规则待核。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 原初始导入权限人员提交前编辑或已认证外部应用提供；最终保存后业务字段按规则锁定

**生命周期**

#### 1

**state**：输入/接收

**行为**：保留原备注，与R分开，放必填后；空值=未填，不能由备注推priority或来源；长度沿原规则待核。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：保留原备注，与R分开，放必填后；空值=未填，不能由备注推priority或来源；长度沿原规则待核。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-003

2. BR-014

**示例**

**valid**

1. 按“手工可选”及本字段格式填写/取得合成联系备注

**invalid**

1. 缺必需联系备注、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-004

3. CHECK-005

4. CHECK-006

5. CHECK-007

6. CHECK-009

7. CHECK-010

8. CHECK-011

9. CHECK-012

10. CHECK-013

11. CHECK-014

12. CHECK-015

13. CHECK-017

14. CHECK-019

15. CHECK-020

16. CHECK-023

17. CHECK-025

18. CHECK-026

19. CHECK-027

20. CHECK-028

21. CHECK-029

22. CHECK-030

23. CHECK-031

24. CHECK-032

25. CHECK-035

26. CHECK-036

27. CHECK-038

28. CHECK-039

29. CHECK-040

30. CHECK-041

31. CHECK-042

32. CHECK-043

33. CHECK-045

34. CHECK-046

35. CHECK-047

36. CHECK-048

37. CHECK-049

38. CHECK-050

39. CHECK-051

40. CHECK-052

41. CHECK-056

42. CHECK-057

43. CHECK-058

44. CHECK-059

45. CHECK-060

46. CHECK-063

47. CHECK-064

48. CHECK-065

49. CHECK-066

50. CHECK-067

51. CHECK-068

52. CHECK-069

53. CHECK-070

54. CHECK-072

55. CHECK-073

56. CHECK-074

57. CHECK-076

58. CHECK-077

59. CHECK-078

60. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-003

2. memory/business-rules.json#BR-014

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-032 线索编码

**标识**：DFIELD-032

**名称**：线索编码

**entity**：ImportRecord

**存储语义键**：leadCode

**类型**：string

**格式**：两方式均保存导入线索编码，不从姓名/号码猜或另造编码；线索类原手工只一个输入并兼容写原键。仅预外呼同tenant/原task/leadCode固定phone用于业务组与累计额外2次；人工保存真实客户/分配关联，不要求预测task或沿预测四元组发额度。人工重复业务规则待正式契约，不从预测归组静默扩展。

**允许为空**：False

**必填条件**：最终新行提交

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 两方式均保存导入线索编码，不从姓名/号码猜或另造编码；线索类原手工只一个输入并兼容写原键。仅预外呼同tenant/原task/leadCode固定phone用于业务组与累计额外2次；人工保存真实客户/分配关联，不要求预测task或沿预测四元组发额度。人工重复业务规则待正式契约，不从预测归组静默扩展。

2. 必须遵守原app/当前明确tenant归属；缺失与不适用分别保留，不猜配或伪造。

**权限**

**read**

1. 授权原应用/当前租户业务范围；人工实际分配坐席及服务端，预测沿任务查看权限

**write**

1. 原初始导入权限人员提交前编辑或已认证外部应用提供；最终保存后业务字段按规则锁定

**生命周期**

#### 1

**state**：接收/关联

**行为**：两方式均保存导入线索编码，不从姓名/号码猜或另造编码；线索类原手工只一个输入并兼容写原键。仅预外呼同tenant/原task/leadCode固定phone用于业务组与累计额外2次；人工保存真实客户/分配关联，不要求预测task或沿预测四元组发额度。人工重复业务规则待正式契约，不从预测归组静默扩展。

#### 2

**state**：保存成功

**行为**：当前新业务有效行和原app/tenant/request/方式一起保存；人工与真实客户/分配关联，预测与真实批次/root关联。历史缺失不补造新编码或批量回写，技术重传复用原值。

#### 3

**state**：拒绝/未知/重传

**行为**：拒绝不生成后续业务；未知保原对象和证据；技术重传返回同一对象，不新增客户/分配/批次/通话。

**派生规则**

**kind**：input

**rule**：两方式均保存导入线索编码，不从姓名/号码猜或另造编码；线索类原手工只一个输入并兼容写原键。仅预外呼同tenant/原task/leadCode固定phone用于业务组与累计额外2次；人工保存真实客户/分配关联，不要求预测task或沿预测四元组发额度。人工重复业务规则待正式契约，不从预测归组静默扩展。

**dependencies**



**保存**

**kind**：stored

**保存时机**：当前新业务有效行和原app/tenant/request/方式一起保存；人工与真实客户/分配关联，预测与真实批次/root关联。历史缺失不补造新编码或批量回写，技术重传复用原值。

**来源**：memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-081, memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-083, memory/project-facts.json

**business_rule_ids**

1. BR-002

2. BR-003

3. BR-013

4. BR-014

**示例**

**valid**

1. 人工有效导入只返回真实客户/分配并保存原编码号码；预测按真实task/file/batch保存。

**invalid**

1. 给人工记录补造预测task/fileId/root，或跨租户按同号猜配：拒绝并保原对象。

**验证引用**

1. CHECK-014

2. CHECK-031

3. CHECK-047

4. CHECK-048

5. CHECK-049

6. CHECK-064

7. CHECK-069

8. CHECK-081

9. CHECK-082

10. CHECK-083

**historical_source_refs**

1. memory/business-rules.json#BR-002

2. memory/business-rules.json#BR-003

3. memory/business-rules.json#BR-013

4. memory/business-rules.json#BR-014

**来源映射**：memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-081, memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-083, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-033 客户号码/固定手机号

**标识**：DFIELD-033

**名称**：客户号码/固定手机号

**entity**：ImportRecord

**存储语义键**：phone

**类型**：string

**格式**：实际客户号码保持原值，格式及类型沿当前验收且正式接口规范待核；仅预外呼同tenant/原task/leadCode要求固定phone，冲突不改号。人工按真实客户/指定坐席关联，不要求预测task/fileId/root；不能因同号跨租户或最近通话盲配，不自动扩展预测失败预算。

**允许为空**：False

**必填条件**：每条有效行/精确关联

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 实际客户号码保持原值，格式及类型沿当前验收且正式接口规范待核；仅预外呼同tenant/原task/leadCode要求固定phone，冲突不改号。人工按真实客户/指定坐席关联，不要求预测task/fileId/root；不能因同号跨租户或最近通话盲配，不自动扩展预测失败预算。

2. 必须遵守原app/当前明确tenant归属；缺失与不适用分别保留，不猜配或伪造。

**权限**

**read**

1. 授权原应用/当前租户业务范围；人工实际分配坐席及服务端，预测沿任务查看权限

**write**

1. 原初始导入权限人员提交前编辑或已认证外部应用提供；最终保存后业务字段按规则锁定

**生命周期**

#### 1

**state**：接收/关联

**行为**：实际客户号码保持原值，格式及类型沿当前验收且正式接口规范待核；仅预外呼同tenant/原task/leadCode要求固定phone，冲突不改号。人工按真实客户/指定坐席关联，不要求预测task/fileId/root；不能因同号跨租户或最近通话盲配，不自动扩展预测失败预算。

#### 2

**state**：保存成功

**行为**：有效行确认时保存原号码及实际模式关系；人工分配不得静默改号码或改派；预测失败补提交沿触发保存phone。历史冲突/关联不明保待核。

#### 3

**state**：拒绝/未知/重传

**行为**：拒绝不生成后续业务；未知保原对象和证据；技术重传返回同一对象，不新增客户/分配/批次/通话。

**派生规则**

**kind**：input

**rule**：实际客户号码保持原值，格式及类型沿当前验收且正式接口规范待核；仅预外呼同tenant/原task/leadCode要求固定phone，冲突不改号。人工按真实客户/指定坐席关联，不要求预测task/fileId/root；不能因同号跨租户或最近通话盲配，不自动扩展预测失败预算。

**dependencies**



**保存**

**kind**：stored

**保存时机**：有效行确认时保存原号码及实际模式关系；人工分配不得静默改号码或改派；预测失败补提交沿触发保存phone。历史冲突/关联不明保待核。

**来源**：memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-081, memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-083, memory/project-facts.json

**business_rule_ids**

1. BR-002

2. BR-003

3. BR-013

4. BR-014

**示例**

**valid**

1. 人工有效导入只返回真实客户/分配并保存原编码号码；预测按真实task/file/batch保存。

**invalid**

1. 给人工记录补造预测task/fileId/root，或跨租户按同号猜配：拒绝并保原对象。

**验证引用**

1. CHECK-014

2. CHECK-023

3. CHECK-047

4. CHECK-048

5. CHECK-049

6. CHECK-052

7. CHECK-076

8. CHECK-081

9. CHECK-082

10. CHECK-083

**historical_source_refs**

1. memory/business-rules.json#BR-002

2. memory/business-rules.json#BR-003

3. memory/business-rules.json#BR-013

4. memory/business-rules.json#BR-014

**来源映射**：memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-081, memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-083, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-034 最终优先级

**标识**：DFIELD-034

**名称**：最终优先级

**entity**：ImportRecord

**存储语义键**：priority

**类型**：ordered scalar

**格式**：无默认值，独立于R；手工可检查后统一/逐条填。保存后不手改/日衰减，异常沿触发值；生产类型/范围待核，不把演示数值当正式协议。 人工外呼沿原必填保存，但不进预测排序/供应商导入；人工列表排序未新增规则。

**允许为空**：False

**必填条件**：外部每行必填；手工最终确认必填

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 无默认值，独立于R；手工可检查后统一/逐条填。保存后不手改/日衰减，异常沿触发值；生产类型/范围待核，不把演示数值当正式协议。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

3. 人工方式不因priority字段自动进入预测队列或拨号。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 原初始导入权限人员提交前编辑或已认证外部应用提供；最终保存后业务字段按规则锁定

**生命周期**

#### 1

**state**：新有效行确认

**行为**：外部先请求幂等后逐行分配，手工先当前预览/权限/最终priority守卫；一起保存本字段。

#### 2

**state**：已保存

**行为**：原record/app/tenant/方式/priority等接收事实保留，预测另存实际batch/root，人工只保真实分配关联。后来新app/主批/操作者不覆盖本记录原来源。

#### 3

**state**：身份/落账未知

**行为**：保原证据待核，不重建新记录或猜默认DCC/新root。

**派生规则**

**kind**：input

**rule**：无默认值，独立于R；手工可检查后统一/逐条填。保存后不手改/日衰减，异常沿触发值；生产类型/范围待核，不把演示数值当正式协议。

**dependencies**



**保存**

**kind**：stored

**保存时机**：有效新业务行通过当前最终守卫时，随record/单号batch及来源/映射原子保存；内部失败尝试继承触发记录，不覆盖此原记录。旧请求重传读取原值，历史缺失不批量回写。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-003

2. BR-006

3. BR-021

**示例**

**valid**

1. 检查草稿待填priority后统一/逐条填完再确认

2. 异常继承原保存值，跨日不变

**invalid**

1. 最终未填自动补3：禁止

2. 异常用后来新主priority替换：禁止

**验证引用**

1. CHECK-001

2. CHECK-005

3. CHECK-006

4. CHECK-007

5. CHECK-009

6. CHECK-010

7. CHECK-011

8. CHECK-012

9. CHECK-013

10. CHECK-014

11. CHECK-015

12. CHECK-017

13. CHECK-019

14. CHECK-020

15. CHECK-023

16. CHECK-025

17. CHECK-026

18. CHECK-027

19. CHECK-029

20. CHECK-030

21. CHECK-031

22. CHECK-032

23. CHECK-035

24. CHECK-036

25. CHECK-039

26. CHECK-040

27. CHECK-041

28. CHECK-042

29. CHECK-043

30. CHECK-045

31. CHECK-046

32. CHECK-047

33. CHECK-048

34. CHECK-049

35. CHECK-050

36. CHECK-051

37. CHECK-052

38. CHECK-056

39. CHECK-057

40. CHECK-058

41. CHECK-059

42. CHECK-060

43. CHECK-063

44. CHECK-064

45. CHECK-065

46. CHECK-066

47. CHECK-067

48. CHECK-068

49. CHECK-069

50. CHECK-070

51. CHECK-072

52. CHECK-073

53. CHECK-074

54. CHECK-076

55. CHECK-077

56. CHECK-078

57. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-003

2. memory/business-rules.json#BR-006

3. memory/business-rules.json#BR-021

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-035 来源信息R

**标识**：DFIELD-035

**名称**：来源信息R

**entity**：ImportRecord

**存储语义键**：r

**类型**：string

**格式**：无字典/允许范围、不默认、不推导priority/可信来源/回传；提供则保留，手工选填后置；通用安全长度待核。

**允许为空**：True

**必填条件**：可选

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 无字典/允许范围、不默认、不推导priority/可信来源/回传；提供则保留，手工选填后置；通用安全长度待核。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 原初始导入权限人员提交前编辑或已认证外部应用提供；最终保存后业务字段按规则锁定

**生命周期**

#### 1

**state**：输入/接收

**行为**：无字典/允许范围、不默认、不推导priority/可信来源/回传；提供则保留，手工选填后置；通用安全长度待核。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：input

**rule**：无字典/允许范围、不默认、不推导priority/可信来源/回传；提供则保留，手工选填后置；通用安全长度待核。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-003

2. BR-014

**示例**

**valid**

1. 按“可选”及本字段格式填写/取得合成来源信息R

**invalid**

1. 缺必需来源信息R、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-004

3. CHECK-005

4. CHECK-006

5. CHECK-007

6. CHECK-009

7. CHECK-010

8. CHECK-011

9. CHECK-012

10. CHECK-013

11. CHECK-014

12. CHECK-015

13. CHECK-017

14. CHECK-019

15. CHECK-020

16. CHECK-023

17. CHECK-025

18. CHECK-026

19. CHECK-027

20. CHECK-028

21. CHECK-029

22. CHECK-030

23. CHECK-031

24. CHECK-032

25. CHECK-035

26. CHECK-036

27. CHECK-038

28. CHECK-039

29. CHECK-040

30. CHECK-041

31. CHECK-042

32. CHECK-043

33. CHECK-045

34. CHECK-046

35. CHECK-047

36. CHECK-048

37. CHECK-049

38. CHECK-050

39. CHECK-051

40. CHECK-052

41. CHECK-056

42. CHECK-057

43. CHECK-058

44. CHECK-059

45. CHECK-060

46. CHECK-063

47. CHECK-064

48. CHECK-065

49. CHECK-066

50. CHECK-067

51. CHECK-068

52. CHECK-069

53. CHECK-070

54. CHECK-072

55. CHECK-073

56. CHECK-074

57. CHECK-076

58. CHECK-077

59. CHECK-078

60. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-003

2. memory/business-rules.json#BR-014

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-036 另开主批标记

**标识**：DFIELD-036

**名称**：另开主批标记

**entity**：ImportRecord

**存储语义键**：isNewBatch

**类型**：boolean

**格式**：仅预外呼：missing=false，提供须严格Boolean，null/字符串false不能当省略；true新主，false有主新子挂最近已保存主，无主首主。手工不加该输入。 人工新导入不适用且不伪造；外呼方式不是手工UI来源。

**允许为空**：True

**必填条件**：仅有效预外呼新业务或已有真实预测关联

**默认值**

**kind**：literal

**value**：False

**rule**：仅预外呼外部逐行字段未传时按false归一；null/字符串不等省略。人工外呼不适用，不自动添false或预测主子对象。

**校验规则**

1. 仅预外呼：missing=false，提供须严格Boolean，null/字符串false不能当省略；true新主，false有主新子挂最近已保存主，无主首主。手工不加该输入。 人工新导入不适用且不伪造；外呼方式不是手工UI来源。

2. 不以默认值、显示名或历史最近值补齐真实关联；未适用字段不伪造。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：仅预外呼：missing=false，提供须严格Boolean，null/字符串false不能当省略；true新主，false有主新子挂最近已保存主，无主首主。手工不加该输入。 人工新导入不适用且不伪造；外呼方式不是手工UI来源。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：input

**rule**：仅预外呼：missing=false，提供须严格Boolean，null/字符串false不能当省略；true新主，false有主新子挂最近已保存主，无主首主。手工不加该输入。 人工新导入不适用且不伪造；外呼方式不是手工UI来源。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-082, memory/project-facts.json

**business_rule_ids**

1. BR-002

2. BR-012

**示例**

**valid**

1. 按“仅外部逐行可选”及本字段格式填写/取得合成另开主批标记

**invalid**

1. 缺必需另开主批标记、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-010

2. CHECK-048

3. CHECK-049

4. CHECK-050

5. CHECK-082

**historical_source_refs**

1. memory/business-rules.json#BR-002

2. memory/business-rules.json#BR-012

**来源映射**：memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-082, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-037 本地客户记录号

**标识**：DFIELD-037

**名称**：本地客户记录号

**entity**：ImportRecord

**存储语义键**：recordId

**类型**：string

**格式**：每个新业务有效行独立，技术重传/同事件重复复用；不覆盖历史记录。

**允许为空**：False

**必填条件**：有效新行落账

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 每个新业务有效行独立，技术重传/同事件重复复用；不覆盖历史记录。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：新有效行确认

**行为**：外部先请求幂等后逐行分配，手工先当前预览/权限/最终priority守卫；一起保存本字段。

#### 2

**state**：已保存

**行为**：原record/app/tenant/方式/priority等接收事实保留，预测另存实际batch/root，人工只保真实分配关联。后来新app/主批/操作者不覆盖本记录原来源。

#### 3

**state**：身份/落账未知

**行为**：保原证据待核，不重建新记录或猜默认DCC/新root。

**派生规则**

**kind**：system

**rule**：每个新业务有效行独立，技术重传/同事件重复复用；不覆盖历史记录。

**dependencies**



**保存**

**kind**：stored

**保存时机**：有效新业务行通过当前最终守卫时，随record/单号batch及来源/映射原子保存；内部失败尝试继承触发记录，不覆盖此原记录。旧请求重传读取原值，历史缺失不批量回写。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-002

2. BR-012

3. BR-015

**示例**

**valid**

1. 按“有效新行落账”及本字段格式填写/取得合成本地客户记录号

**invalid**

1. 缺必需本地客户记录号、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-002

2. memory/business-rules.json#BR-012

3. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-038 本次单号批次号

**标识**：DFIELD-038

**名称**：本次单号批次号

**entity**：ImportRecord

**存储语义键**：batchId

**类型**：string

**格式**：仅预外呼：一手机号一业务批次，主子都新batch；无第三层，不作为供应商actualfileId。 人工新导入不适用且不伪造；外呼方式不是手工UI来源。

**允许为空**：True

**必填条件**：仅有效预外呼新业务或已有真实预测关联

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 仅预外呼：一手机号一业务批次，主子都新batch；无第三层，不作为供应商actualfileId。 人工新导入不适用且不伪造；外呼方式不是手工UI来源。

2. 不以默认值、显示名或历史最近值补齐真实关联；未适用字段不伪造。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：新有效行确认

**行为**：仅预外呼：一手机号一业务批次，主子都新batch；无第三层，不作为供应商actualfileId。 人工新导入不适用且不伪造；外呼方式不是手工UI来源。

#### 2

**state**：已保存

**行为**：record/root/原来源/priority等原事实稳定，后来新app/主批/操作人不覆盖；子批新建独立记录。

#### 3

**state**：身份/落账未知

**行为**：保原证据待核，不重建新记录或猜默认DCC/新root。

**派生规则**

**kind**：system

**rule**：仅预外呼：一手机号一业务批次，主子都新batch；无第三层，不作为供应商actualfileId。 人工新导入不适用且不伪造；外呼方式不是手工UI来源。

**dependencies**



**保存**

**kind**：stored

**保存时机**：有效新业务行通过当前最终守卫时，随record/单号batch及来源/映射原子保存；内部失败尝试继承触发记录，不覆盖此原记录。旧请求重传读取原值，历史缺失不批量回写。

**来源**：memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-082, memory/project-facts.json

**business_rule_ids**

1. BR-002

2. BR-012

**示例**

**valid**

1. 按“有效新行落账”及本字段格式填写/取得合成本次单号批次号

**invalid**

1. 缺必需本次单号批次号、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-010

2. CHECK-048

3. CHECK-049

4. CHECK-050

5. CHECK-082

**historical_source_refs**

1. memory/business-rules.json#BR-002

2. memory/business-rules.json#BR-012

**来源映射**：memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-082, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-039 关联主批

**标识**：DFIELD-039

**名称**：关联主批

**entity**：ImportRecord

**存储语义键**：rootBatchId

**类型**：string

**格式**：仅预外呼：新主root=batch，子直挂最近已保存同组主（稳定创建序）；内部失败子批固定触发root，不挂后来新主，不造parent。 人工新导入不适用且不伪造；外呼方式不是手工UI来源。

**允许为空**：True

**必填条件**：仅有效预外呼新业务或已有真实预测关联

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 仅预外呼：新主root=batch，子直挂最近已保存同组主（稳定创建序）；内部失败子批固定触发root，不挂后来新主，不造parent。 人工新导入不适用且不伪造；外呼方式不是手工UI来源。

2. 不以默认值、显示名或历史最近值补齐真实关联；未适用字段不伪造。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：新有效行确认

**行为**：仅预外呼：新主root=batch，子直挂最近已保存同组主（稳定创建序）；内部失败子批固定触发root，不挂后来新主，不造parent。 人工新导入不适用且不伪造；外呼方式不是手工UI来源。

#### 2

**state**：已保存

**行为**：record/root/原来源/priority等原事实稳定，后来新app/主批/操作人不覆盖；子批新建独立记录。

#### 3

**state**：身份/落账未知

**行为**：保原证据待核，不重建新记录或猜默认DCC/新root。

**派生规则**

**kind**：system

**rule**：仅预外呼：新主root=batch，子直挂最近已保存同组主（稳定创建序）；内部失败子批固定触发root，不挂后来新主，不造parent。 人工新导入不适用且不伪造；外呼方式不是手工UI来源。

**dependencies**



**保存**

**kind**：stored

**保存时机**：有效新业务行通过当前最终守卫时，随record/单号batch及来源/映射原子保存；内部失败尝试继承触发记录，不覆盖此原记录。旧请求重传读取原值，历史缺失不批量回写。

**来源**：memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-082, memory/project-facts.json

**business_rule_ids**

1. BR-002

2. BR-012

3. BR-015

**示例**

**valid**

1. 按“当前可执行记录须可核；历史未知待核”及本字段格式填写/取得合成关联主批

**invalid**

1. 缺必需关联主批、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-010

2. CHECK-048

3. CHECK-049

4. CHECK-050

5. CHECK-082

**historical_source_refs**

1. memory/business-rules.json#BR-002

2. memory/business-rules.json#BR-012

3. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-082, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-040 主子归属

**标识**：DFIELD-040

**名称**：主子归属

**entity**：ImportRecord

**存储语义键**：batchKind

**类型**：enum

**格式**：仅预外呼：本方master/child为候选表示；历史未知独立待核，attempt不是第三层业务批。 人工新导入不适用且不伪造；外呼方式不是手工UI来源。

**允许为空**：True

**必填条件**：仅有效预外呼新业务或已有真实预测关联

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 仅预外呼：本方master/child为候选表示；历史未知独立待核，attempt不是第三层业务批。 人工新导入不适用且不伪造；外呼方式不是手工UI来源。

2. 不以默认值、显示名或历史最近值补齐真实关联；未适用字段不伪造。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：新有效行确认

**行为**：仅预外呼：本方master/child为候选表示；历史未知独立待核，attempt不是第三层业务批。 人工新导入不适用且不伪造；外呼方式不是手工UI来源。

#### 2

**state**：已保存

**行为**：record/root/原来源/priority等原事实稳定，后来新app/主批/操作人不覆盖；子批新建独立记录。

#### 3

**state**：身份/落账未知

**行为**：保原证据待核，不重建新记录或猜默认DCC/新root。

**派生规则**

**kind**：system

**rule**：仅预外呼：本方master/child为候选表示；历史未知独立待核，attempt不是第三层业务批。 人工新导入不适用且不伪造；外呼方式不是手工UI来源。

**dependencies**



**保存**

**kind**：stored

**保存时机**：有效新业务行通过当前最终守卫时，随record/单号batch及来源/映射原子保存；内部失败尝试继承触发记录，不覆盖此原记录。旧请求重传读取原值，历史缺失不批量回写。

**来源**：memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-082, memory/project-facts.json

**business_rule_ids**

1. BR-002

2. BR-012

**示例**

**valid**

1. 按“分配明确时”及本字段格式填写/取得合成主子归属

**invalid**

1. 缺必需主子归属、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-010

2. CHECK-048

3. CHECK-049

4. CHECK-050

5. CHECK-082

**historical_source_refs**

1. memory/business-rules.json#BR-002

2. memory/business-rules.json#BR-012

**来源映射**：memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-082, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-041 原接入应用

**标识**：DFIELD-041

**名称**：原接入应用

**entity**：ImportRecord

**存储语义键**：originalAppId

**类型**：string

**格式**：接口接收时认证取得stableApp并保存；每个业务系统自己的应用，多租户共用app但记录tenant独立；内部尝试及后续人工跟进继承原app，不因应用改名/删除或新主变更。

**允许为空**：True

**必填条件**：外部新记录必需，手工可空

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 接口接收时认证取得stableApp并保存；每个业务系统自己的应用，多租户共用app但记录tenant独立；内部尝试及后续人工跟进继承原app，不因应用改名/删除或新主变更。

2. 不以默认值、显示名或历史最近值补齐真实关联；未适用字段不伪造。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：新有效行确认

**行为**：接口接收时认证取得stableApp并保存；每个业务系统自己的应用，多租户共用app但记录tenant独立；内部尝试及后续人工跟进继承原app，不因应用改名/删除或新主变更。

#### 2

**state**：已保存

**行为**：原record/app/tenant/方式/priority等接收事实保留，预测另存实际batch/root，人工只保真实分配关联。后来新app/主批/操作者不覆盖本记录原来源。

#### 3

**state**：身份/落账未知

**行为**：保原证据待核，不重建新记录或猜默认DCC/新root。

**派生规则**

**kind**：system

**rule**：接口接收时认证取得stableApp并保存；每个业务系统自己的应用，多租户共用app但记录tenant独立；内部尝试及后续人工跟进继承原app，不因应用改名/删除或新主变更。

**dependencies**



**保存**

**kind**：stored

**保存时机**：有效新业务行通过当前最终守卫时，随record/单号batch及来源/映射原子保存；内部失败尝试继承触发记录，不覆盖此原记录。旧请求重传读取原值，历史缺失不批量回写。

**来源**：memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-089, memory/project-facts.json

**business_rule_ids**

1. BR-001

2. BR-016

3. BR-017

**示例**

**valid**

1. 按“外部新记录必需，手工可空”及本字段格式填写/取得合成原接入应用

**invalid**

1. 缺必需原接入应用、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-014

2. CHECK-018

3. CHECK-047

4. CHECK-071

5. CHECK-089

**historical_source_refs**

1. memory/business-rules.json#BR-001

2. memory/business-rules.json#BR-016

3. memory/business-rules.json#BR-017

**来源映射**：memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-089, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-042 可信原来源

**标识**：DFIELD-042

**名称**：可信原来源

**entity**：ImportRecord

**存储语义键**：originalSource

**类型**：enum

**格式**：由认证稳定应用登记识别业务系统（含DCC/天网）；source报文若保留仅核一致。手工UI无应用由可信登录上下文识别；未知来源待核，不默认DCC。

**允许为空**：True

**必填条件**：接收和路由

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 由认证稳定应用登记识别业务系统（含DCC/天网）；source报文若保留仅核一致。手工UI无应用由可信登录上下文识别；未知来源待核，不默认DCC。

2. 不以默认值、显示名或历史最近值补齐真实关联；未适用字段不伪造。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：新有效行确认

**行为**：由认证稳定应用登记识别业务系统（含DCC/天网）；source报文若保留仅核一致。手工UI无应用由可信登录上下文识别；未知来源待核，不默认DCC。

#### 2

**state**：已保存

**行为**：原record/app/tenant/方式/priority等接收事实保留，预测另存实际batch/root，人工只保真实分配关联。后来新app/主批/操作者不覆盖本记录原来源。

#### 3

**state**：身份/落账未知

**行为**：保原证据待核，不重建新记录或猜默认DCC/新root。

**派生规则**

**kind**：system

**rule**：由认证稳定应用登记识别业务系统（含DCC/天网）；source报文若保留仅核一致。手工UI无应用由可信登录上下文识别；未知来源待核，不默认DCC。

**dependencies**



**保存**

**kind**：stored

**保存时机**：有效新业务行通过当前最终守卫时，随record/单号batch及来源/映射原子保存；内部失败尝试继承触发记录，不覆盖此原记录。旧请求重传读取原值，历史缺失不批量回写。

**来源**：memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-080, memory/normalized-user-stories.json#AC-075, memory/project-facts.json

**business_rule_ids**

1. BR-016

2. BR-017

**示例**

**valid**

1. 按“接收和路由”及本字段格式填写/取得合成可信原来源

**invalid**

1. 缺必需可信原来源、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-014

2. CHECK-047

3. CHECK-080

4. CHECK-075

**historical_source_refs**

1. memory/business-rules.json#BR-016

2. memory/business-rules.json#BR-017

**来源映射**：memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-080, memory/normalized-user-stories.json#AC-075, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-043 原结果交付策略

**标识**：DFIELD-043

**名称**：原结果交付策略

**entity**：ImportRecord

**存储语义键**：deliveryPolicy

**类型**：enum

**格式**：所有应用接口来源按原应用配置回调，覆盖DCC/天网及两种方式；缺callback新导入拒绝。仅无接入应用的手工UI来源local-only。root/当前操作者不改回调路由。

**允许为空**：True

**必填条件**：记录接收时保存

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 所有应用接口来源按原应用配置回调，覆盖DCC/天网及两种方式；缺callback新导入拒绝。仅无接入应用的手工UI来源local-only。root/当前操作者不改回调路由。

2. 不以默认值、显示名或历史最近值补齐真实关联；未适用字段不伪造。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：新有效行确认

**行为**：所有应用接口来源按原应用配置回调，覆盖DCC/天网及两种方式；缺callback新导入拒绝。仅无接入应用的手工UI来源local-only。root/当前操作者不改回调路由。

#### 2

**state**：已保存

**行为**：原record/app/tenant/方式/priority等接收事实保留，预测另存实际batch/root，人工只保真实分配关联。后来新app/主批/操作者不覆盖本记录原来源。

#### 3

**state**：身份/落账未知

**行为**：保原证据待核，不重建新记录或猜默认DCC/新root。

**派生规则**

**kind**：calculated

**rule**：所有应用接口来源按原应用配置回调，覆盖DCC/天网及两种方式；缺callback新导入拒绝。仅无接入应用的手工UI来源local-only。root/当前操作者不改回调路由。

**dependencies**

1. DFIELD-042

2. DFIELD-041

**保存**

**kind**：stored

**保存时机**：有效新业务行通过当前最终守卫时，随record/单号batch及来源/映射原子保存；内部失败尝试继承触发记录，不覆盖此原记录。旧请求重传读取原值，历史缺失不批量回写。

**来源**：memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-086, memory/project-facts.json

**business_rule_ids**

1. BR-016

2. BR-017

**示例**

**valid**

1. 按“记录接收时保存”及本字段格式填写/取得合成原结果交付策略

**invalid**

1. 缺必需原结果交付策略、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-018

2. CHECK-037

3. CHECK-071

4. CHECK-075

5. CHECK-086

**historical_source_refs**

1. memory/business-rules.json#BR-016

2. memory/business-rules.json#BR-017

**来源映射**：memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-086, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-044 本次接收时间

**标识**：DFIELD-044

**名称**：本次接收时间

**entity**：ImportRecord

**存储语义键**：receivedAt

**类型**：timestamp

**格式**：本方当前接收时刻与失败确认/尝试排队分开，展示北京时间；不用于每日衰减。

**允许为空**：False

**必填条件**：有效行保存

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 本方当前接收时刻与失败确认/尝试排队分开，展示北京时间；不用于每日衰减。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：新有效行确认

**行为**：外部先请求幂等后逐行分配，手工先当前预览/权限/最终priority守卫；一起保存本字段。

#### 2

**state**：已保存

**行为**：原record/app/tenant/方式/priority等接收事实保留，预测另存实际batch/root，人工只保真实分配关联。后来新app/主批/操作者不覆盖本记录原来源。

#### 3

**state**：身份/落账未知

**行为**：保原证据待核，不重建新记录或猜默认DCC/新root。

**派生规则**

**kind**：system

**rule**：本方当前接收时刻与失败确认/尝试排队分开，展示北京时间；不用于每日衰减。

**dependencies**



**保存**

**kind**：stored

**保存时机**：有效新业务行通过当前最终守卫时，随record/单号batch及来源/映射原子保存；内部失败尝试继承触发记录，不覆盖此原记录。旧请求重传读取原值，历史缺失不批量回写。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-006

2. BR-012

3. BR-021

**示例**

**valid**

1. 按“有效行保存”及本字段格式填写/取得合成本次接收时间

**invalid**

1. 缺必需本次接收时间、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-004

4. CHECK-005

5. CHECK-006

6. CHECK-007

7. CHECK-009

8. CHECK-010

9. CHECK-011

10. CHECK-012

11. CHECK-013

12. CHECK-014

13. CHECK-015

14. CHECK-016

15. CHECK-017

16. CHECK-018

17. CHECK-019

18. CHECK-020

19. CHECK-021

20. CHECK-022

21. CHECK-023

22. CHECK-024

23. CHECK-025

24. CHECK-026

25. CHECK-027

26. CHECK-028

27. CHECK-029

28. CHECK-030

29. CHECK-031

30. CHECK-032

31. CHECK-034

32. CHECK-035

33. CHECK-036

34. CHECK-037

35. CHECK-038

36. CHECK-039

37. CHECK-040

38. CHECK-041

39. CHECK-042

40. CHECK-043

41. CHECK-045

42. CHECK-046

43. CHECK-047

44. CHECK-048

45. CHECK-049

46. CHECK-050

47. CHECK-051

48. CHECK-052

49. CHECK-056

50. CHECK-057

51. CHECK-058

52. CHECK-059

53. CHECK-060

54. CHECK-061

55. CHECK-062

56. CHECK-063

57. CHECK-064

58. CHECK-065

59. CHECK-066

60. CHECK-067

61. CHECK-068

62. CHECK-069

63. CHECK-070

64. CHECK-071

65. CHECK-072

66. CHECK-073

67. CHECK-074

68. CHECK-075

69. CHECK-076

70. CHECK-077

71. CHECK-078

72. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-006

2. memory/business-rules.json#BR-012

3. memory/business-rules.json#BR-021

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-045 原导入时间

**标识**：DFIELD-045

**名称**：原导入时间

**entity**：ImportRecord

**存储语义键**：originalImportAt

**类型**：timestamp

**格式**：仅原值审计，缺失不伪造；异常保原时间另存本次排队时刻。

**允许为空**：True

**必填条件**：来源可核时

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 仅原值审计，缺失不伪造；异常保原时间另存本次排队时刻。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：仅原值审计，缺失不伪造；异常保原时间另存本次排队时刻。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：仅原值审计，缺失不伪造；异常保原时间另存本次排队时刻。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-006

2. BR-021

**示例**

**valid**

1. 按“来源可核时”及本字段格式填写/取得合成原导入时间

**invalid**

1. 缺必需原导入时间、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-005

3. CHECK-006

4. CHECK-007

5. CHECK-009

6. CHECK-010

7. CHECK-011

8. CHECK-012

9. CHECK-013

10. CHECK-014

11. CHECK-015

12. CHECK-017

13. CHECK-019

14. CHECK-020

15. CHECK-023

16. CHECK-025

17. CHECK-026

18. CHECK-027

19. CHECK-029

20. CHECK-030

21. CHECK-031

22. CHECK-032

23. CHECK-035

24. CHECK-036

25. CHECK-039

26. CHECK-040

27. CHECK-041

28. CHECK-042

29. CHECK-043

30. CHECK-045

31. CHECK-046

32. CHECK-047

33. CHECK-048

34. CHECK-049

35. CHECK-050

36. CHECK-051

37. CHECK-052

38. CHECK-056

39. CHECK-057

40. CHECK-058

41. CHECK-059

42. CHECK-060

43. CHECK-063

44. CHECK-064

45. CHECK-065

46. CHECK-066

47. CHECK-067

48. CHECK-068

49. CHECK-069

50. CHECK-070

51. CHECK-072

52. CHECK-073

53. CHECK-074

54. CHECK-076

55. CHECK-077

56. CHECK-078

57. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-006

2. memory/business-rules.json#BR-021

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-046 主批稳定创建序

**标识**：DFIELD-046

**名称**：主批稳定创建序

**entity**：ImportRecord

**存储语义键**：createdOrder

**类型**：ordered identifier

**格式**：按本地已保存主创建顺序，不按结果时间/同号最近/priority/子批。精度和并发序由工程评审。

**允许为空**：False

**必填条件**：选择最近主时

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 按本地已保存主创建顺序，不按结果时间/同号最近/priority/子批。精度和并发序由工程评审。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：新有效行确认

**行为**：外部先请求幂等后逐行分配，手工先当前预览/权限/最终priority守卫；一起保存本字段。

#### 2

**state**：已保存

**行为**：原record/app/tenant/方式/priority等接收事实保留，预测另存实际batch/root，人工只保真实分配关联。后来新app/主批/操作者不覆盖本记录原来源。

#### 3

**state**：身份/落账未知

**行为**：保原证据待核，不重建新记录或猜默认DCC/新root。

**派生规则**

**kind**：system

**rule**：按本地已保存主创建顺序，不按结果时间/同号最近/priority/子批。精度和并发序由工程评审。

**dependencies**



**保存**

**kind**：stored

**保存时机**：有效新业务行通过当前最终守卫时，随record/单号batch及来源/映射原子保存；内部失败尝试继承触发记录，不覆盖此原记录。旧请求重传读取原值，历史缺失不批量回写。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-002

2. BR-012

**示例**

**valid**

1. 按“选择最近主时”及本字段格式填写/取得合成主批稳定创建序

**invalid**

1. 缺必需主批稳定创建序、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-004

4. CHECK-005

5. CHECK-006

6. CHECK-007

7. CHECK-009

8. CHECK-010

9. CHECK-011

10. CHECK-012

11. CHECK-013

12. CHECK-014

13. CHECK-015

14. CHECK-016

15. CHECK-017

16. CHECK-018

17. CHECK-019

18. CHECK-020

19. CHECK-021

20. CHECK-022

21. CHECK-023

22. CHECK-024

23. CHECK-025

24. CHECK-026

25. CHECK-027

26. CHECK-028

27. CHECK-029

28. CHECK-030

29. CHECK-031

30. CHECK-032

31. CHECK-034

32. CHECK-035

33. CHECK-036

34. CHECK-037

35. CHECK-038

36. CHECK-039

37. CHECK-040

38. CHECK-041

39. CHECK-042

40. CHECK-043

41. CHECK-045

42. CHECK-046

43. CHECK-047

44. CHECK-048

45. CHECK-049

46. CHECK-050

47. CHECK-051

48. CHECK-052

49. CHECK-056

50. CHECK-057

51. CHECK-058

52. CHECK-059

53. CHECK-060

54. CHECK-061

55. CHECK-062

56. CHECK-063

57. CHECK-064

58. CHECK-065

59. CHECK-066

60. CHECK-067

61. CHECK-068

62. CHECK-069

63. CHECK-070

64. CHECK-071

65. CHECK-072

66. CHECK-073

67. CHECK-074

68. CHECK-075

69. CHECK-076

70. CHECK-077

71. CHECK-078

72. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-002

2. memory/business-rules.json#BR-012

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-047 本地保存阶段

**标识**：DFIELD-047

**名称**：本地保存阶段

**entity**：ImportRecord

**存储语义键**：localState

**类型**：enum

**格式**：校验失败/已保存/待核分开；已保存不等供应商受理或通话完成。

**允许为空**：False

**必填条件**：导入记录展示

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 校验失败/已保存/待核分开；已保存不等供应商受理或通话完成。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：校验失败/已保存/待核分开；已保存不等供应商受理或通话完成。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：校验失败/已保存/待核分开；已保存不等供应商受理或通话完成。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**business_rule_ids**

1. BR-004

2. BR-018

**示例**

**valid**

1. 按“导入记录展示”及本字段格式填写/取得合成本地保存阶段

**invalid**

1. 缺必需本地保存阶段、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-017

17. CHECK-018

18. CHECK-019

19. CHECK-020

20. CHECK-023

21. CHECK-025

22. CHECK-028

23. CHECK-029

24. CHECK-030

25. CHECK-031

26. CHECK-032

27. CHECK-033

28. CHECK-035

29. CHECK-036

30. CHECK-037

31. CHECK-038

32. CHECK-039

33. CHECK-040

34. CHECK-041

35. CHECK-042

36. CHECK-043

37. CHECK-045

38. CHECK-046

39. CHECK-047

40. CHECK-048

41. CHECK-049

42. CHECK-050

43. CHECK-051

44. CHECK-052

45. CHECK-056

46. CHECK-057

47. CHECK-058

48. CHECK-059

49. CHECK-060

50. CHECK-062

51. CHECK-063

52. CHECK-064

53. CHECK-065

54. CHECK-066

55. CHECK-067

56. CHECK-068

57. CHECK-069

58. CHECK-070

59. CHECK-071

60. CHECK-073

61. CHECK-074

62. CHECK-075

63. CHECK-076

64. CHECK-077

65. CHECK-078

**historical_source_refs**

1. memory/business-rules.json#BR-004

2. memory/business-rules.json#BR-018

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-048 提交尝试号

**标识**：DFIELD-048

**名称**：提交尝试号

**entity**：SubmissionAttempt

**存储语义键**：attemptId

**类型**：string

**格式**：稳定内部执行标识；新业务补提交新attempt，技术恢复/UNKNOWN保原attempt，不伪造外部request。

**允许为空**：False

**必填条件**：初始或失败业务执行

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 稳定内部执行标识；新业务补提交新attempt，技术恢复/UNKNOWN保原attempt，不伪造外部request。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：计划/等待

**行为**：未实际授权执行的计划不能冒已发起attempt。

#### 2

**state**：取得执行权

**行为**：建立固定attempt，先保存后外发；失败业务同槽绑定。

#### 3

**state**：重复/恢复/UNKNOWN

**行为**：复用原ID/映射，不用换ID绕过占用。

**派生规则**

**kind**：system

**rule**：稳定内部执行标识；新业务补提交新attempt，技术恢复/UNKNOWN保原attempt，不伪造外部request。

**dependencies**



**保存**

**kind**：stored

**保存时机**：仅新业务提交取得当前执行权后建立并持久绑定原record/触发事件/原root；失败补提交与预占/action在同原子协议保存。技术恢复/UNKNOWN使用同ID。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-012

2. BR-015

**示例**

**valid**

1. 按“初始或失败业务执行”及本字段格式填写/取得合成提交尝试号

**invalid**

1. 缺必需提交尝试号、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-012

2. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-049 提交类别

**标识**：DFIELD-049

**名称**：提交类别

**entity**：SubmissionAttempt

**存储语义键**：kind

**类型**：enum

**格式**：initial/failure_auto/failure_manual为建议编码；秒挂无此动作，结果交付不是供应商提交。

**允许为空**：False

**必填条件**：建立尝试

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. initial/failure_auto/failure_manual为建议编码；秒挂无此动作，结果交付不是供应商提交。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：initial/failure_auto/failure_manual为建议编码；秒挂无此动作，结果交付不是供应商提交。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：initial/failure_auto/failure_manual为建议编码；秒挂无此动作，结果交付不是供应商提交。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-009

2. BR-011

3. BR-013

**示例**

**valid**

1. 按“建立尝试”及本字段格式填写/取得合成提交类别

**invalid**

1. 缺必需提交类别、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-002

2. CHECK-003

3. CHECK-004

4. CHECK-008

5. CHECK-011

6. CHECK-012

7. CHECK-013

8. CHECK-014

9. CHECK-015

10. CHECK-016

11. CHECK-018

12. CHECK-019

13. CHECK-020

14. CHECK-021

15. CHECK-022

16. CHECK-023

17. CHECK-024

18. CHECK-025

19. CHECK-026

20. CHECK-027

21. CHECK-028

22. CHECK-029

23. CHECK-031

24. CHECK-032

25. CHECK-033

26. CHECK-034

27. CHECK-035

28. CHECK-036

29. CHECK-037

30. CHECK-038

31. CHECK-039

32. CHECK-040

33. CHECK-041

34. CHECK-042

35. CHECK-043

36. CHECK-046

37. CHECK-052

38. CHECK-059

39. CHECK-061

40. CHECK-062

41. CHECK-063

42. CHECK-064

43. CHECK-065

44. CHECK-066

45. CHECK-067

46. CHECK-068

47. CHECK-070

48. CHECK-071

49. CHECK-072

50. CHECK-073

51. CHECK-074

52. CHECK-075

53. CHECK-076

54. CHECK-077

55. CHECK-078

56. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-009

2. memory/business-rules.json#BR-011

3. memory/business-rules.json#BR-013

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-050 触发失败事件

**标识**：DFIELD-050

**名称**：触发失败事件

**entity**：SubmissionAttempt

**存储语义键**：triggerEventId

**类型**：string

**格式**：必须可信准确稳定事件，重复沿原计划/attempt，不因晚更重计时；正式稳定键待核。

**允许为空**：True

**必填条件**：失败补提必需，初始可空

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 必须可信准确稳定事件，重复沿原计划/attempt，不因晚更重计时；正式稳定键待核。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：必须可信准确稳定事件，重复沿原计划/attempt，不因晚更重计时；正式稳定键待核。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：必须可信准确稳定事件，重复沿原计划/attempt，不因晚更重计时；正式稳定键待核。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-009

2. BR-012

3. BR-015

**示例**

**valid**

1. 按“失败补提必需，初始可空”及本字段格式填写/取得合成触发失败事件

**invalid**

1. 缺必需触发失败事件、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-009

2. memory/business-rules.json#BR-012

3. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-051 触发记录号

**标识**：DFIELD-051

**名称**：触发记录号

**entity**：SubmissionAttempt

**存储语义键**：triggerRecordId

**类型**：string

**格式**：精确引用原record继承root/source/priority/四元组，不能用最近同号替换。

**允许为空**：False

**必填条件**：尝试保存

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 精确引用原record继承root/source/priority/四元组，不能用最近同号替换。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：精确引用原record继承root/source/priority/四元组，不能用最近同号替换。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：精确引用原record继承root/source/priority/四元组，不能用最近同号替换。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-012

2. BR-015

3. BR-017

**示例**

**valid**

1. 按“尝试保存”及本字段格式填写/取得合成触发记录号

**invalid**

1. 缺必需触发记录号、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-012

2. memory/business-rules.json#BR-015

3. memory/business-rules.json#BR-017

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-052 实际供应商fileId

**标识**：DFIELD-052

**名称**：实际供应商fileId

**entity**：SubmissionAttempt

**存储语义键**：supplierFileId

**类型**：supplier identifier

**格式**：新业务补提交独立fileId是已审建议；实际同号接收/排重/生成规则待核。保存真实fileId，不用本地batch/root替代，不自动追加旧fileId。

**允许为空**：True

**必填条件**：可信实际值取得后

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 新业务补提交独立fileId是已审建议；实际同号接收/排重/生成规则待核。保存真实fileId，不用本地batch/root替代，不自动追加旧fileId。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：外发准备

**行为**：新业务独立fileId为候选协议，实际生成/接收仍待供应商。

#### 2

**state**：取得可信实际值

**行为**：保存原task/record/attempt到actualfileId的对应证据。

#### 3

**state**：缺失/多候选/UNKNOWN

**行为**：不猜最新同号，不用本地batch/root补齐；精确删除/结果归属依赖不足则待核。

**派生规则**

**kind**：external

**rule**：新业务补提交独立fileId是已审建议；实际同号接收/排重/生成规则待核。保存真实fileId，不用本地batch/root替代，不自动追加旧fileId。

**dependencies**



**保存**

**kind**：stored

**保存时机**：取得与当前attempt一致的可信实际fileId时保存精确映射；未取得保持缺失/待核。后续真实供应商证据只能补全同attempt，不把root当值或盲追加旧fileId。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-004

2. BR-012

3. BR-015

4. BR-018

**示例**

**valid**

1. 按“可信实际值取得后”及本字段格式填写/取得合成实际供应商fileId

**invalid**

1. 缺必需实际供应商fileId、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-004

2. memory/business-rules.json#BR-012

3. memory/business-rules.json#BR-015

4. memory/business-rules.json#BR-018

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-053 供应商提交状态

**标识**：DFIELD-053

**名称**：供应商提交状态

**entity**：SubmissionAttempt

**存储语义键**：state

**类型**：enum

**格式**：待执行/预占/实际发起/明确受理/明确拒绝/UNKNOWN分开；是否实际发起不明保同attempt/槽，不盲新发。

**允许为空**：False

**必填条件**：提交生命周期

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 待执行/预占/实际发起/明确受理/明确拒绝/UNKNOWN分开；是否实际发起不明保同attempt/槽，不盲新发。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：待执行/预占/实际发起/明确受理/明确拒绝/UNKNOWN分开；是否实际发起不明保同attempt/槽，不盲新发。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：待执行/预占/实际发起/明确受理/明确拒绝/UNKNOWN分开；是否实际发起不明保同attempt/槽，不盲新发。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-004

2. BR-013

3. BR-015

4. BR-018

**示例**

**valid**

1. 按“提交生命周期”及本字段格式填写/取得合成供应商提交状态

**invalid**

1. 缺必需供应商提交状态、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-004

2. memory/business-rules.json#BR-013

3. memory/business-rules.json#BR-015

4. memory/business-rules.json#BR-018

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-054 本次排队时间

**标识**：DFIELD-054

**名称**：本次排队时间

**entity**：SubmissionAttempt

**存储语义键**：queuedAt

**类型**：timestamp

**格式**：同任务保存priority高先，同级本次FIFO；异常另存时间且保原导入审计，不重排已受理/UNKNOWN。

**允许为空**：False

**必填条件**：加入待提交队列

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 同任务保存priority高先，同级本次FIFO；异常另存时间且保原导入审计，不重排已受理/UNKNOWN。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：同任务保存priority高先，同级本次FIFO；异常另存时间且保原导入审计，不重排已受理/UNKNOWN。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：同任务保存priority高先，同级本次FIFO；异常另存时间且保原导入审计，不重排已受理/UNKNOWN。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-021

**示例**

**valid**

1. 按“加入待提交队列”及本字段格式填写/取得合成本次排队时间

**invalid**

1. 缺必需本次排队时间、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-011

2. CHECK-012

3. CHECK-013

4. CHECK-014

5. CHECK-015

6. CHECK-019

7. CHECK-020

8. CHECK-023

9. CHECK-025

10. CHECK-026

11. CHECK-027

12. CHECK-032

13. CHECK-035

14. CHECK-039

15. CHECK-040

16. CHECK-041

17. CHECK-042

18. CHECK-043

19. CHECK-046

20. CHECK-052

21. CHECK-063

22. CHECK-064

23. CHECK-065

24. CHECK-066

25. CHECK-067

26. CHECK-068

27. CHECK-070

28. CHECK-072

29. CHECK-073

30. CHECK-074

31. CHECK-076

32. CHECK-077

33. CHECK-078

34. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-021

**来源映射**：memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-055 实际发起时刻

**标识**：DFIELD-055

**名称**：实际发起时刻

**entity**：SubmissionAttempt

**存储语义键**：startedAt

**类型**：timestamp

**格式**：不能用计划/点击代替；跨外发边界未知保占用，崩溃恢复必须沿同attempt证据核查。

**允许为空**：True

**必填条件**：确认已实际新业务发起

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 不能用计划/点击代替；跨外发边界未知保占用，崩溃恢复必须沿同attempt证据核查。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：预占前后尚未发起

**行为**：startedAt未成立，不能用点击/计划时间代替。

#### 2

**state**：实际发起明确

**行为**：写当前attempt实际发起时刻一次，同槽计一次。

#### 3

**state**：崩溃/超时边界不明

**行为**：不补猜测时间、不释放；用原attempt证据恢复。

**派生规则**

**kind**：system

**rule**：不能用计划/点击代替；跨外发边界未知保占用，崩溃恢复必须沿同attempt证据核查。

**dependencies**



**保存**

**kind**：stored

**保存时机**：可靠确认当前attempt跨过实际业务外发边界时写一次，并与同槽reserved→used状态一致保存；是否已发起无法确认时不造时间，保UNKNOWN占用。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-013

2. BR-015

**示例**

**valid**

1. 按“确认已实际新业务发起”及本字段格式填写/取得合成实际发起时刻

**invalid**

1. 缺必需实际发起时刻、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-013

2. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-056 同步结果码

**标识**：DFIELD-056

**名称**：同步结果码

**entity**：SupplierImport

**存储语义键**：result

**类型**：raw supplier value

**格式**：保原result/description/errorCode，不补0；result0不是逐条全成功。

**允许为空**：True

**必填条件**：实际响应存在

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 保原result/description/errorCode，不补0；result0不是逐条全成功。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：保原result/description/errorCode，不补0；result0不是逐条全成功。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：external

**rule**：保原result/description/errorCode，不补0；result0不是逐条全成功。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**business_rule_ids**

1. BR-004

2. BR-018

**示例**

**valid**

1. 按“实际响应存在”及本字段格式填写/取得合成同步结果码

**invalid**

1. 缺必需同步结果码、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-017

17. CHECK-018

18. CHECK-019

19. CHECK-020

20. CHECK-023

21. CHECK-025

22. CHECK-028

23. CHECK-029

24. CHECK-030

25. CHECK-031

26. CHECK-032

27. CHECK-033

28. CHECK-035

29. CHECK-036

30. CHECK-037

31. CHECK-038

32. CHECK-039

33. CHECK-040

34. CHECK-041

35. CHECK-042

36. CHECK-043

37. CHECK-045

38. CHECK-046

39. CHECK-047

40. CHECK-048

41. CHECK-049

42. CHECK-050

43. CHECK-051

44. CHECK-052

45. CHECK-056

46. CHECK-057

47. CHECK-058

48. CHECK-059

49. CHECK-060

50. CHECK-062

51. CHECK-063

52. CHECK-064

53. CHECK-065

54. CHECK-066

55. CHECK-067

56. CHECK-068

57. CHECK-069

58. CHECK-070

59. CHECK-071

60. CHECK-073

61. CHECK-074

62. CHECK-075

63. CHECK-076

64. CHECK-077

65. CHECK-078

**historical_source_refs**

1. memory/business-rules.json#BR-004

2. memory/business-rules.json#BR-018

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-057 导入数量原值

**标识**：DFIELD-057

**名称**：导入数量原值

**entity**：SupplierImport

**存储语义键**：counts

**类型**：object

**格式**：分别保存importTotal/successTotal/invalidTotal非负原值；缺失不是0，汇总不能任意指认哪行成功，矛盾待核。

**允许为空**：True

**必填条件**：实际响应携带

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 分别保存importTotal/successTotal/invalidTotal非负原值；缺失不是0，汇总不能任意指认哪行成功，矛盾待核。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：分别保存importTotal/successTotal/invalidTotal非负原值；缺失不是0，汇总不能任意指认哪行成功，矛盾待核。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：external

**rule**：分别保存importTotal/successTotal/invalidTotal非负原值；缺失不是0，汇总不能任意指认哪行成功，矛盾待核。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**business_rule_ids**

1. BR-018

**示例**

**valid**

1. 按“实际响应携带”及本字段格式填写/取得合成导入数量原值

**invalid**

1. 缺必需导入数量原值、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-002

2. CHECK-003

3. CHECK-004

4. CHECK-008

5. CHECK-011

6. CHECK-012

7. CHECK-013

8. CHECK-014

9. CHECK-015

10. CHECK-018

11. CHECK-019

12. CHECK-020

13. CHECK-023

14. CHECK-025

15. CHECK-028

16. CHECK-029

17. CHECK-031

18. CHECK-032

19. CHECK-033

20. CHECK-035

21. CHECK-037

22. CHECK-038

23. CHECK-039

24. CHECK-040

25. CHECK-041

26. CHECK-042

27. CHECK-043

28. CHECK-046

29. CHECK-052

30. CHECK-059

31. CHECK-062

32. CHECK-063

33. CHECK-064

34. CHECK-066

35. CHECK-067

36. CHECK-070

37. CHECK-071

38. CHECK-073

39. CHECK-075

40. CHECK-078

**historical_source_refs**

1. memory/business-rules.json#BR-018

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-058 供应商企业号

**标识**：DFIELD-058

**名称**：供应商企业号

**entity**：SupplierEvidence

**存储语义键**：enterpriseId

**类型**：supplier identifier

**格式**：必须有核实enterprise→tenant映射；缺失/多候选待核，不猜租户。

**允许为空**：True

**必填条件**：回调租户映射

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 必须有核实enterprise→tenant映射；缺失/多候选待核，不猜租户。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：必须有核实enterprise→tenant映射；缺失/多候选待核，不猜租户。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：external

**rule**：必须有核实enterprise→tenant映射；缺失/多候选待核，不猜租户。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-015

2. BR-018

**示例**

**valid**

1. 按“回调租户映射”及本字段格式填写/取得合成供应商企业号

**invalid**

1. 缺必需供应商企业号、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-015

2. memory/business-rules.json#BR-018

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-059 供应商事件种类

**标识**：DFIELD-059

**名称**：供应商事件种类

**entity**：SupplierEvidence

**存储语义键**：eventType

**类型**：raw code

**格式**：普通call/SIP、预测呼叫失败、53导入失败分开；未知不得按相似原因猜类。

**允许为空**：True

**必填条件**：分类前

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 普通call/SIP、预测呼叫失败、53导入失败分开；未知不得按相似原因猜类。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：普通call/SIP、预测呼叫失败、53导入失败分开；未知不得按相似原因猜类。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：external

**rule**：普通call/SIP、预测呼叫失败、53导入失败分开；未知不得按相似原因猜类。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-008

2. BR-009

3. BR-018

**示例**

**valid**

1. 按“分类前”及本字段格式填写/取得合成供应商事件种类

**invalid**

1. 缺必需供应商事件种类、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-002

2. CHECK-003

3. CHECK-004

4. CHECK-008

5. CHECK-011

6. CHECK-012

7. CHECK-013

8. CHECK-014

9. CHECK-015

10. CHECK-018

11. CHECK-019

12. CHECK-020

13. CHECK-023

14. CHECK-025

15. CHECK-026

16. CHECK-027

17. CHECK-028

18. CHECK-029

19. CHECK-031

20. CHECK-032

21. CHECK-033

22. CHECK-035

23. CHECK-036

24. CHECK-037

25. CHECK-038

26. CHECK-039

27. CHECK-040

28. CHECK-041

29. CHECK-042

30. CHECK-043

31. CHECK-046

32. CHECK-052

33. CHECK-059

34. CHECK-062

35. CHECK-063

36. CHECK-064

37. CHECK-065

38. CHECK-066

39. CHECK-067

40. CHECK-068

41. CHECK-070

42. CHECK-071

43. CHECK-072

44. CHECK-073

45. CHECK-074

46. CHECK-075

47. CHECK-076

48. CHECK-077

49. CHECK-078

50. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-008

2. memory/business-rules.json#BR-009

3. memory/business-rules.json#BR-018

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-060 稳定事件号

**标识**：DFIELD-060

**名称**：稳定事件号

**entity**：SupplierEvidence

**存储语义键**：eventId

**类型**：string

**格式**：call按真实call精确定位，无call可用可靠事件；正式唯一键/验真待核，不伪造话单。

**允许为空**：True

**必填条件**：无call失败去重必须可信

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. call按真实call精确定位，无call可用可靠事件；正式唯一键/验真待核，不伪造话单。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：call按真实call精确定位，无call可用可靠事件；正式唯一键/验真待核，不伪造话单。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：external

**rule**：call按真实call精确定位，无call可用可靠事件；正式唯一键/验真待核，不伪造话单。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-012

2. BR-015

**示例**

**valid**

1. 按“无call失败去重必须可信”及本字段格式填写/取得合成稳定事件号

**invalid**

1. 缺必需稳定事件号、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-012

2. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-061 原始供应商证据

**标识**：DFIELD-061

**名称**：原始供应商证据

**entity**：SupplierEvidence

**存储语义键**：rawPayload

**类型**：object or raw text

**格式**：保原字段类型值及来源，解码失败不丢原文；敏感数据按原权限读取，不能用派生分类覆盖原status/SIP。

**允许为空**：False

**必填条件**：事件或响应接收

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 保原字段类型值及来源，解码失败不丢原文；敏感数据按原权限读取，不能用派生分类覆盖原status/SIP。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：保原字段类型值及来源，解码失败不丢原文；敏感数据按原权限读取，不能用派生分类覆盖原status/SIP。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：external

**rule**：保原字段类型值及来源，解码失败不丢原文；敏感数据按原权限读取，不能用派生分类覆盖原status/SIP。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-010

2. BR-015

3. BR-018

4. BR-019

**示例**

**valid**

1. 按“事件或响应接收”及本字段格式填写/取得合成原始供应商证据

**invalid**

1. 缺必需原始供应商证据、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-010

2. memory/business-rules.json#BR-015

3. memory/business-rules.json#BR-018

4. memory/business-rules.json#BR-019

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-062 可信及关联状态

**标识**：DFIELD-062

**名称**：可信及关联状态

**entity**：SupplierEvidence

**存储语义键**：trustState

**类型**：enum

**格式**：可信唯一/未可信/多候选/真实冲突分开；未可信SIP隔离，不污染已确认call，也不阻挡后续可信更新。

**允许为空**：False

**必填条件**：归一/策略前

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 可信唯一/未可信/多候选/真实冲突分开；未可信SIP隔离，不污染已确认call，也不阻挡后续可信更新。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：可信唯一/未可信/多候选/真实冲突分开；未可信SIP隔离，不污染已确认call，也不阻挡后续可信更新。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：external

**rule**：可信唯一/未可信/多候选/真实冲突分开；未可信SIP隔离，不污染已确认call，也不阻挡后续可信更新。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-008

2. BR-010

3. BR-015

**示例**

**valid**

1. 按“归一/策略前”及本字段格式填写/取得合成可信及关联状态

**invalid**

1. 缺必需可信及关联状态、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-008

2. memory/business-rules.json#BR-010

3. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-063 原预测呼叫失败原因

**标识**：DFIELD-063

**名称**：原预测呼叫失败原因

**entity**：PredictiveFailure

**存储语义键**：reason

**类型**：string or raw code

**格式**：保原failType/message。禁呼/限呼/restrict tel三自动，八人工，过频正常规则；未知待核，同步/53不属此类。

**允许为空**：True

**必填条件**：可信失败接收

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 保原failType/message。禁呼/限呼/restrict tel三自动，八人工，过频正常规则；未知待核，同步/53不属此类。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：保原failType/message。禁呼/限呼/restrict tel三自动，八人工，过频正常规则；未知待核，同步/53不属此类。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：保原failType/message。禁呼/限呼/restrict tel三自动，八人工，过频正常规则；未知待核，同步/53不属此类。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-009

2. BR-018

**示例**

**valid**

1. 按“可信失败接收”及本字段格式填写/取得合成原预测呼叫失败原因

**invalid**

1. 缺必需原预测呼叫失败原因、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-002

2. CHECK-003

3. CHECK-004

4. CHECK-008

5. CHECK-011

6. CHECK-012

7. CHECK-013

8. CHECK-014

9. CHECK-015

10. CHECK-018

11. CHECK-019

12. CHECK-020

13. CHECK-023

14. CHECK-025

15. CHECK-026

16. CHECK-027

17. CHECK-028

18. CHECK-029

19. CHECK-031

20. CHECK-032

21. CHECK-033

22. CHECK-035

23. CHECK-036

24. CHECK-037

25. CHECK-038

26. CHECK-039

27. CHECK-040

28. CHECK-041

29. CHECK-042

30. CHECK-043

31. CHECK-046

32. CHECK-052

33. CHECK-059

34. CHECK-062

35. CHECK-063

36. CHECK-064

37. CHECK-065

38. CHECK-066

39. CHECK-067

40. CHECK-068

41. CHECK-070

42. CHECK-071

43. CHECK-072

44. CHECK-073

45. CHECK-074

46. CHECK-075

47. CHECK-076

48. CHECK-077

49. CHECK-078

50. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-009

2. memory/business-rules.json#BR-018

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-064 处理分类

**标识**：DFIELD-064

**名称**：处理分类

**entity**：PredictiveFailure

**存储语义键**：category

**类型**：enum

**格式**：TASK_RULE/AUTO_120/MANUAL/UNKNOWN为建议码；分类本身不计次数，秒挂不归失败补提。

**允许为空**：False

**必填条件**：分类后

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. TASK_RULE/AUTO_120/MANUAL/UNKNOWN为建议码；分类本身不计次数，秒挂不归失败补提。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：TASK_RULE/AUTO_120/MANUAL/UNKNOWN为建议码；分类本身不计次数，秒挂不归失败补提。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：TASK_RULE/AUTO_120/MANUAL/UNKNOWN为建议码；分类本身不计次数，秒挂不归失败补提。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-008

2. BR-009

3. BR-011

**示例**

**valid**

1. 按“分类后”及本字段格式填写/取得合成处理分类

**invalid**

1. 缺必需处理分类、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-002

2. CHECK-003

3. CHECK-004

4. CHECK-014

5. CHECK-015

6. CHECK-016

7. CHECK-018

8. CHECK-019

9. CHECK-020

10. CHECK-021

11. CHECK-022

12. CHECK-023

13. CHECK-024

14. CHECK-025

15. CHECK-026

16. CHECK-027

17. CHECK-028

18. CHECK-029

19. CHECK-032

20. CHECK-033

21. CHECK-034

22. CHECK-035

23. CHECK-036

24. CHECK-037

25. CHECK-038

26. CHECK-039

27. CHECK-040

28. CHECK-041

29. CHECK-042

30. CHECK-043

31. CHECK-052

32. CHECK-059

33. CHECK-061

34. CHECK-062

35. CHECK-063

36. CHECK-064

37. CHECK-065

38. CHECK-066

39. CHECK-067

40. CHECK-068

41. CHECK-070

42. CHECK-071

43. CHECK-072

44. CHECK-073

45. CHECK-074

46. CHECK-075

47. CHECK-076

48. CHECK-077

49. CHECK-078

50. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-008

2. memory/business-rules.json#BR-009

3. memory/business-rules.json#BR-011

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-065 平台本次确认失败时刻

**标识**：DFIELD-065

**名称**：平台本次确认失败时刻

**entity**：PredictiveFailure

**存储语义键**：confirmedAt

**类型**：timestamp

**格式**：从平台收到并确认准确失败立即保存；不是supplier callTime/计划/点击。重复晚更不重计，新真实失败另起。

**允许为空**：False

**必填条件**：首次准确确认时

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 从平台收到并确认准确失败立即保存；不是supplier callTime/计划/点击。重复晚更不重计，新真实失败另起。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：原始事件到达但未能准确确认

**行为**：原文可留证，不能以未经确认的时间启动自动计划。

#### 2

**state**：首次准确确认

**行为**：立即写本次confirmedAt，来源是平台确认时刻，不是供应商callTime/用户点击/计划创建。

#### 3

**state**：重复或可信晚更

**行为**：保原confirmedAt不重启120秒；新真实失败另有自己的confirmedAt。

**派生规则**

**kind**：system

**rule**：从平台收到并确认准确失败立即保存；不是supplier callTime/计划/点击。重复晚更不重计，新真实失败另起。

**dependencies**



**保存**

**kind**：stored

**保存时机**：平台首次收到并确认本次准确预测失败（稳定事件及精确记录关联成立）时立即一次写入；后续同事件重复/可信晚更不改。新的真实失败用新事件记录另写新确认时间。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-009

2. BR-015

**示例**

**valid**

1. 按“首次准确确认时”及本字段格式填写/取得合成平台本次确认失败时刻

**invalid**

1. 缺必需平台本次确认失败时刻、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-009

2. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-066 处理计划/待人工对象

**标识**：DFIELD-066

**名称**：处理计划/待人工对象

**entity**：FailurePlan

**存储语义键**：planId

**类型**：string

**格式**：同事件最多一有效计划或待人工对象，重复复用；秒挂无计划，生产去重键待设计。

**允许为空**：True

**必填条件**：准确失败后

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 同事件最多一有效计划或待人工对象，重复复用；秒挂无计划，生产去重键待设计。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：同事件最多一有效计划或待人工对象，重复复用；秒挂无计划，生产去重键待设计。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：同事件最多一有效计划或待人工对象，重复复用；秒挂无计划，生产去重键待设计。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-009

2. BR-011

3. BR-015

**示例**

**valid**

1. 按“准确失败后”及本字段格式填写/取得合成处理计划/待人工对象

**invalid**

1. 缺必需处理计划/待人工对象、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-009

2. memory/business-rules.json#BR-011

3. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-067 自动到期时间

**标识**：DFIELD-067

**名称**：自动到期时间

**entity**：FailurePlan

**存储语义键**：dueAt

**类型**：timestamp

**格式**：confirmedAt+120秒，八人工null且无倒计时；暂停恢复重核，不重置本次确认时刻。

**允许为空**：True

**必填条件**：只三类自动

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. confirmedAt+120秒，八人工null且无倒计时；暂停恢复重核，不重置本次确认时刻。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：唯一三类计划创建

**行为**：准确confirmedAt加120秒写固定dueAt。

#### 2

**state**：等待/暂停/恢复/重复

**行为**：到期值固定；恢复重新核执行条件，不以当前时间重新加120秒。

#### 3

**state**：八类人工或秒挂

**行为**：八类dueAt=null且无自动计时；秒挂不创建计划。

#### 4

**state**：确认时间或事件身份缺失

**行为**：待核，不临时采用收到原文时间或点击时间生成dueAt。

**派生规则**

**kind**：calculated

**rule**：confirmedAt+120秒，八人工null且无倒计时；暂停恢复重核，不重置本次确认时刻。

**dependencies**

1. DFIELD-065

2. DFIELD-064

**保存**

**kind**：stored

**保存时机**：仅为已确认三类自动失败创建唯一计划时写confirmedAt+120秒；重复事件/晚更/挂起恢复不重算。八类人工不写到期时刻，秒挂无计划。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-009

2. BR-015

**示例**

**valid**

1. 按“只三类自动”及本字段格式填写/取得合成自动到期时间

**invalid**

1. 缺必需自动到期时间、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-009

2. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-068 失败处理进度

**标识**：DFIELD-068

**名称**：失败处理进度

**entity**：FailurePlan

**存储语义键**：state

**类型**：enum

**格式**：待到期/待人工/挂起/执行中/受理/拒绝/待核/停止；终止/精准取消只停未执行计划，不假撤回在途。

**允许为空**：False

**必填条件**：失败对象存在时

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 待到期/待人工/挂起/执行中/受理/拒绝/待核/停止；终止/精准取消只停未执行计划，不假撤回在途。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：待到期/待人工/挂起/执行中/受理/拒绝/待核/停止；终止/精准取消只停未执行计划，不假撤回在途。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：待到期/待人工/挂起/执行中/受理/拒绝/待核/停止；终止/精准取消只停未执行计划，不假撤回在途。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-007

2. BR-009

3. BR-015

4. BR-022

**示例**

**valid**

1. 按“失败对象存在时”及本字段格式填写/取得合成失败处理进度

**invalid**

1. 缺必需失败处理进度、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-007

2. memory/business-rules.json#BR-009

3. memory/business-rules.json#BR-015

4. memory/business-rules.json#BR-022

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-069 累计额度四元组

**标识**：DFIELD-069

**名称**：累计额度四元组

**entity**：FailureBudget

**存储语义键**：scope

**类型**：tuple

**格式**：tenant+原task+服务端保存leadCode+固定phone；不含app/root/fileId/原因/人。历史身份或账不足待核，不默认发2次。

**允许为空**：False

**必填条件**：计划/确认/执行前

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. tenant+原task+服务端保存leadCode+固定phone；不含app/root/fileId/原因/人。历史身份或账不足待核，不默认发2次。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：tenant+原task+服务端保存leadCode+固定phone；不含app/root/fileId/原因/人。历史身份或账不足待核，不默认发2次。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：calculated

**rule**：tenant+原task+服务端保存leadCode+固定phone；不含app/root/fileId/原因/人。历史身份或账不足待核，不默认发2次。

**dependencies**

1. DFIELD-014

2. DFIELD-015

3. DFIELD-032

4. DFIELD-033

**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-013

2. BR-015

**示例**

**valid**

1. 同tenant/task/lead/phone换app或另开主批仍共享原两次

**invalid**

1. root或app变化初始化used=0：禁止

2. 历史账不明默认remaining=2：禁止

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-013

2. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-070 已用额外次数

**标识**：DFIELD-070

**名称**：已用额外次数

**entity**：FailureBudget

**存储语义键**：used

**类型**：integer

**格式**：0..2；初始不计，实际新失败业务发起计1，明确受理和拒绝均计；历史未知非0，跨新主/app不重置。

**允许为空**：True

**必填条件**：可信累计账

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 0..2；初始不计，实际新失败业务发起计1，明确受理和拒绝均计；历史未知非0，跨新主/app不重置。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：账可核且无旧用量

**行为**：只有证明四元组无历史已用/占用才可初始化0；新app/root不初始化新账。

#### 2

**state**：外发前预占

**行为**：used不增加，原槽标reserved。

#### 3

**state**：实际发起可确认

**行为**：同槽reserved转used一次；不能reserved+used双扣同一attempt。

#### 4

**state**：发起边界不明或响应未知

**行为**：不凭未知增加第二槽、不释放原槽；已知发起保used，未知响应独立标记。

#### 5

**state**：重复/拒绝/下载/删除

**行为**：重复不重计；明确导入拒绝也不退已发起用量；清理删除不重置。

**派生规则**

**kind**：system

**rule**：0..2；初始不计，实际新失败业务发起计1，明确受理和拒绝均计；历史未知非0，跨新主/app不重置。

**dependencies**



**保存**

**kind**：stored

**保存时机**：同一四元组两槽账中，可信确认一个新的失败业务尝试已实际发起时，将该attempt同槽从reserved转为used，原子记一次；受理/明确拒绝/已发起但响应未知均不退还。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-013

2. BR-015

**示例**

**valid**

1. 按“可信累计账”及本字段格式填写/取得合成已用额外次数

**invalid**

1. 缺必需已用额外次数、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-013

2. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-071 持久预占

**标识**：DFIELD-071

**名称**：持久预占

**entity**：FailureBudget

**存储语义键**：reserved

**类型**：integer

**格式**：0..2，预占不等已用；只有已证明未外发的原计划才可按同原子协议取消释放，状态未知不能释放新发。

**允许为空**：True

**必填条件**：外发前及恢复

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 0..2，预占不等已用；只有已证明未外发的原计划才可按同原子协议取消释放，状态未知不能释放新发。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：计划/点击/重复命令

**行为**：仅计划或点击不新增预占；重复复用原槽。

#### 2

**state**：准备外发且守卫通过

**行为**：同attempt持久预占一个槽，尚不算已用。

#### 3

**state**：实际发起

**行为**：同槽转used且不留另一个计费reserved。

#### 4

**state**：发起边界UNKNOWN

**行为**：保原槽及证据待核，不能释放后另开尝试。

#### 5

**state**：确认未外发且合法取消

**行为**：在同一原子协议释放原reserved；已发起/边界未知不能释放。

**派生规则**

**kind**：system

**rule**：0..2，预占不等已用；只有已证明未外发的原计划才可按同原子协议取消释放，状态未知不能释放新发。

**dependencies**



**保存**

**kind**：stored

**保存时机**：新有效动作在全部守卫通过并取得独占执行权后、真正外发前，原子持久预占一个可用槽并绑定同attempt；实际发起时同槽转used。只有证明未外发的原尝试才可按同原子协议取消释放。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-013

2. BR-015

**示例**

**valid**

1. 按“外发前及恢复”及本字段格式填写/取得合成持久预占

**invalid**

1. 缺必需持久预占、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-013

2. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-072 未知占用

**标识**：DFIELD-072

**名称**：未知占用

**entity**：FailureBudget

**存储语义键**：unknownHeld

**类型**：integer

**格式**：同attempt保占用；与used/reserved须同槽消重，不能重复扣同次也不能把UNKNOWN当空槽。物理账模型待工程。

**允许为空**：True

**必填条件**：存在UNKNOWN尝试

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 同attempt保占用；与used/reserved须同槽消重，不能重复扣同次也不能把UNKNOWN当空槽。物理账模型待工程。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：没有未知且账可核

**行为**：可显示0；历史账未知不能默认0。

#### 2

**state**：发起边界未知

**行为**：保原槽并标未知，不释放、不新发。

#### 3

**state**：已发起但响应未知

**行为**：保used同槽并附未知标记，unknownHeld不额外再扣一槽。

#### 4

**state**：可信恢复

**行为**：只更新该原attempt同槽的证据/状态；不能把恢复当新业务计次。

**派生规则**

**kind**：system

**rule**：同attempt保占用；与used/reserved须同槽消重，不能重复扣同次也不能把UNKNOWN当空槽。物理账模型待工程。

**dependencies**



**保存**

**kind**：stored

**保存时机**：发生发起边界或响应UNKNOWN时，在原attempt/原槽上保存未知占用状态；该字段为按槽去重后的未知展示，不能作为used/reserved之外再次扣除的独立额度。可信恢复证据到来时更新同槽。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-013

2. BR-015

**示例**

**valid**

1. 按“存在UNKNOWN尝试”及本字段格式填写/取得合成未知占用

**invalid**

1. 缺必需未知占用、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-013

2. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-073 可用额外次数

**标识**：DFIELD-073

**名称**：可用额外次数

**entity**：FailureBudget

**存储语义键**：remaining

**类型**：integer

**格式**：0..2，按两槽尚可分配数量算，不只2-used忽略预占；账未知显待核。删除资格不要求剩余大于0。

**允许为空**：True

**必填条件**：账完整可核

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 0..2，按两槽尚可分配数量算，不只2-used忽略预占；账未知显待核。删除资格不要求剩余大于0。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：完整可信账

**行为**：按2减已被占用的唯一槽数量计算0..2，同槽used/reserved/unknown标签不重复扣。

#### 2

**state**：预占转used

**行为**：占用的是同一个槽，remaining不再次减少。

#### 3

**state**：合法释放未外发槽

**行为**：随同原子提交恢复该一个槽；已发起/UNKNOWN不回加。

#### 4

**state**：历史账或边界未知

**行为**：无法可靠派生时显示待核而非默认2；不得用新root/app重建可用值。

**派生规则**

**kind**：calculated

**rule**：0..2，按两槽尚可分配数量算，不只2-used忽略预占；账未知显待核。删除资格不要求剩余大于0。

**dependencies**

1. DFIELD-070

2. DFIELD-071

3. DFIELD-072

**保存**

**kind**：stored

**保存时机**：在两槽账每次可信原子预占/同槽发起转换/合法未外发取消/证据恢复提交后，按唯一槽占用派生或同步保存剩余视图。展示值不是执行授权，实际外发仍读原子账。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-007

2. BR-013

3. BR-015

**示例**

**valid**

1. 按“账完整可核”及本字段格式填写/取得合成可用额外次数

**invalid**

1. 缺必需可用额外次数、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-007

2. memory/business-rules.json#BR-013

3. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-074 后续执行权

**标识**：DFIELD-074

**名称**：后续执行权

**entity**：FailureBudget

**存储语义键**：executionRight

**类型**：enum

**格式**：本方自动/人工与AliCti原生互斥；未查到话单/缺finishRetryFlag不能证明无在途。未核不真实发起，不先删后导。

**允许为空**：True

**必填条件**：形成和实际执行前

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 本方自动/人工与AliCti原生互斥；未查到话单/缺finishRetryFlag不能证明无在途。未核不真实发起，不先删后导。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：本方自动/人工与AliCti原生互斥；未查到话单/缺finishRetryFlag不能证明无在途。未核不真实发起，不先删后导。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：本方自动/人工与AliCti原生互斥；未查到话单/缺finishRetryFlag不能证明无在途。未核不真实发起，不先删后导。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-009

2. BR-015

**示例**

**valid**

1. 按“形成和实际执行前”及本字段格式填写/取得合成后续执行权

**invalid**

1. 缺必需后续执行权、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-009

2. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-075 实际通话标识

**标识**：DFIELD-075

**名称**：实际通话标识

**entity**：CallResult

**存储语义键**：callId

**类型**：supplier identifier

**格式**：实际可信通话标识；预外呼用准确原task/实际fileId/号码/call匹配；人工使用真实客户/分配/坐席与call关系，不伪造预测task/fileId/root。无话单稳定事件可无callId且不伪造一通，未知不按最近同号或时间猜配；同call晚更不新增呼叫。

**允许为空**：True

**必填条件**：真实call关联

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 实际可信通话标识；预外呼用准确原task/实际fileId/号码/call匹配；人工使用真实客户/分配/坐席与call关系，不伪造预测task/fileId/root。无话单稳定事件可无callId且不伪造一通，未知不按最近同号或时间猜配；同call晚更不新增呼叫。

2. 必须遵守原app/当前明确tenant归属；缺失与不适用分别保留，不猜配或伪造。

**权限**

**read**

1. 授权原应用/当前租户业务范围；人工实际分配坐席及服务端，预测沿任务查看权限

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：接收/关联

**行为**：实际可信通话标识；预外呼用准确原task/实际fileId/号码/call匹配；人工使用真实客户/分配/坐席与call关系，不伪造预测task/fileId/root。无话单稳定事件可无callId且不伪造一通，未知不按最近同号或时间猜配；同call晚更不新增呼叫。

#### 2

**state**：保存成功

**行为**：取得可信真实通话证据且按实际方式准确关联时保存；重复或可信晚更更新同一call。缺callId时保稳定事件及待核，不用预测映射填人工空值。人工状态及后续跟进不改此标识。

#### 3

**state**：拒绝/未知/重传

**行为**：拒绝不生成后续业务；未知保原对象和证据；技术重传返回同一对象，不新增客户/分配/批次/通话。

**派生规则**

**kind**：external

**rule**：实际可信通话标识；预外呼用准确原task/实际fileId/号码/call匹配；人工使用真实客户/分配/坐席与call关系，不伪造预测task/fileId/root。无话单稳定事件可无callId且不伪造一通，未知不按最近同号或时间猜配；同call晚更不新增呼叫。

**dependencies**



**保存**

**kind**：stored

**保存时机**：取得可信真实通话证据且按实际方式准确关联时保存；重复或可信晚更更新同一call。缺callId时保稳定事件及待核，不用预测映射填人工空值。人工状态及后续跟进不改此标识。

**来源**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-088, memory/normalized-user-stories.json#AC-089, memory/normalized-user-stories.json#AC-090, memory/project-facts.json

**business_rule_ids**

1. BR-008

2. BR-010

3. BR-012

4. BR-015

**示例**

**valid**

1. 人工有效导入只返回真实客户/分配并保存原编码号码；预测按真实task/file/batch保存。

**invalid**

1. 给人工记录补造预测task/fileId/root，或跨租户按同号猜配：拒绝并保原对象。

**验证引用**

1. CHECK-002

2. CHECK-023

3. CHECK-033

4. CHECK-035

5. CHECK-052

6. CHECK-062

7. CHECK-082

8. CHECK-088

9. CHECK-089

10. CHECK-090

**historical_source_refs**

1. memory/business-rules.json#BR-008

2. memory/business-rules.json#BR-010

3. memory/business-rules.json#BR-012

4. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-088, memory/normalized-user-stories.json#AC-089, memory/normalized-user-stories.json#AC-090, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-076 原通话状态

**标识**：DFIELD-076

**名称**：原通话状态

**entity**：CallResult

**存储语义键**：status

**类型**：raw supplier value

**格式**：保存原status/statusDesc；未核枚举未知，本方秒挂分类另存，不改供应商原值。

**允许为空**：True

**必填条件**：实际字段存在

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 保存原status/statusDesc；未核枚举未知，本方秒挂分类另存，不改供应商原值。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：保存原status/statusDesc；未核枚举未知，本方秒挂分类另存，不改供应商原值。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：保存原status/statusDesc；未核枚举未知，本方秒挂分类另存，不改供应商原值。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-008

2. BR-010

3. BR-011

**示例**

**valid**

1. 按“实际字段存在”及本字段格式填写/取得合成原通话状态

**invalid**

1. 缺必需原通话状态、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-002

2. CHECK-003

3. CHECK-004

4. CHECK-014

5. CHECK-015

6. CHECK-016

7. CHECK-018

8. CHECK-019

9. CHECK-020

10. CHECK-021

11. CHECK-022

12. CHECK-023

13. CHECK-024

14. CHECK-025

15. CHECK-026

16. CHECK-027

17. CHECK-028

18. CHECK-029

19. CHECK-032

20. CHECK-033

21. CHECK-034

22. CHECK-035

23. CHECK-036

24. CHECK-037

25. CHECK-038

26. CHECK-039

27. CHECK-040

28. CHECK-041

29. CHECK-042

30. CHECK-043

31. CHECK-052

32. CHECK-059

33. CHECK-061

34. CHECK-062

35. CHECK-063

36. CHECK-064

37. CHECK-065

38. CHECK-066

39. CHECK-067

40. CHECK-068

41. CHECK-070

42. CHECK-071

43. CHECK-072

44. CHECK-073

45. CHECK-074

46. CHECK-075

47. CHECK-077

48. CHECK-078

49. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-008

2. memory/business-rules.json#BR-010

3. memory/business-rules.json#BR-011

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-077 SIP原字段

**标识**：DFIELD-077

**名称**：SIP原字段

**entity**：CallResult

**存储语义键**：sipEvidence

**类型**：object

**格式**：分别保sipCause/obSipCause/sipCauseAsyncUpdateFlag及来源；同call可信晚更不新通话，未可信SIP独立待核。

**允许为空**：True

**必填条件**：实际SIP可信更新

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 分别保sipCause/obSipCause/sipCauseAsyncUpdateFlag及来源；同call可信晚更不新通话，未可信SIP独立待核。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：分别保sipCause/obSipCause/sipCauseAsyncUpdateFlag及来源；同call可信晚更不新通话，未可信SIP独立待核。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：分别保sipCause/obSipCause/sipCauseAsyncUpdateFlag及来源；同call可信晚更不新通话，未可信SIP独立待核。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-008

2. BR-015

**示例**

**valid**

1. 按“实际SIP可信更新”及本字段格式填写/取得合成SIP原字段

**invalid**

1. 缺必需SIP原字段、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-008

2. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-078 供应商最后标志

**标识**：DFIELD-078

**名称**：供应商最后标志

**entity**：CallResult

**存储语义键**：finishRetryFlag

**类型**：integer

**格式**：严格1最后一条/0否/null未知，不证明任务全部完成/无在途；不等SIP更新。

**允许为空**：True

**必填条件**：实际结果存在

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 严格1最后一条/0否/null未知，不证明任务全部完成/无在途；不等SIP更新。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：严格1最后一条/0否/null未知，不证明任务全部完成/无在途；不等SIP更新。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：严格1最后一条/0否/null未知，不证明任务全部完成/无在途；不等SIP更新。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-008

2. BR-011

3. BR-017

**示例**

**valid**

1. 按“实际结果存在”及本字段格式填写/取得合成供应商最后标志

**invalid**

1. 缺必需供应商最后标志、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-002

2. CHECK-003

3. CHECK-004

4. CHECK-014

5. CHECK-015

6. CHECK-016

7. CHECK-018

8. CHECK-019

9. CHECK-020

10. CHECK-021

11. CHECK-022

12. CHECK-023

13. CHECK-024

14. CHECK-025

15. CHECK-026

16. CHECK-027

17. CHECK-028

18. CHECK-029

19. CHECK-032

20. CHECK-033

21. CHECK-034

22. CHECK-035

23. CHECK-036

24. CHECK-037

25. CHECK-038

26. CHECK-039

27. CHECK-040

28. CHECK-041

29. CHECK-042

30. CHECK-043

31. CHECK-052

32. CHECK-059

33. CHECK-061

34. CHECK-062

35. CHECK-063

36. CHECK-064

37. CHECK-065

38. CHECK-066

39. CHECK-067

40. CHECK-068

41. CHECK-070

42. CHECK-071

43. CHECK-072

44. CHECK-073

45. CHECK-074

46. CHECK-075

47. CHECK-077

48. CHECK-078

49. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-008

2. memory/business-rules.json#BR-011

3. memory/business-rules.json#BR-017

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-079 挂断方原值

**标识**：DFIELD-079

**名称**：挂断方原值

**entity**：CallResult

**存储语义键**：onHookSource

**类型**：raw supplier value

**格式**：正式枚举/目标部署含义待核，不能任意文本猜客户主动挂断。

**允许为空**：True

**必填条件**：原话单存在

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 正式枚举/目标部署含义待核，不能任意文本猜客户主动挂断。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：正式枚举/目标部署含义待核，不能任意文本猜客户主动挂断。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：external

**rule**：正式枚举/目标部署含义待核，不能任意文本猜客户主动挂断。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**business_rule_ids**

1. BR-010

**示例**

**valid**

1. 按“原话单存在”及本字段格式填写/取得合成挂断方原值

**invalid**

1. 缺必需挂断方原值、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-004

2. CHECK-014

3. CHECK-015

4. CHECK-018

5. CHECK-019

6. CHECK-021

7. CHECK-022

8. CHECK-023

9. CHECK-024

10. CHECK-025

11. CHECK-027

12. CHECK-028

13. CHECK-029

14. CHECK-032

15. CHECK-034

16. CHECK-037

17. CHECK-038

18. CHECK-039

19. CHECK-040

20. CHECK-041

21. CHECK-042

22. CHECK-043

23. CHECK-052

24. CHECK-059

25. CHECK-070

26. CHECK-071

27. CHECK-075

28. CHECK-078

**historical_source_refs**

1. memory/business-rules.json#BR-010

**来源映射**：memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-080 客户有效时长原值

**标识**：DFIELD-080

**名称**：客户有效时长原值

**entity**：CallResult

**存储语义键**：customerDurationRaw

**类型**：number or raw value

**格式**：保存原值和单位；缺失/异常/负数未知，不补0，不用坐席桥接时长替代客户时长。

**允许为空**：True

**必填条件**：原话单存在

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 保存原值和单位；缺失/异常/负数未知，不补0，不用坐席桥接时长替代客户时长。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：保存原值和单位；缺失/异常/负数未知，不补0，不用坐席桥接时长替代客户时长。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：external

**rule**：保存原值和单位；缺失/异常/负数未知，不补0，不用坐席桥接时长替代客户时长。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**business_rule_ids**

1. BR-010

**示例**

**valid**

1. 按“原话单存在”及本字段格式填写/取得合成客户有效时长原值

**invalid**

1. 缺必需客户有效时长原值、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-004

2. CHECK-014

3. CHECK-015

4. CHECK-018

5. CHECK-019

6. CHECK-021

7. CHECK-022

8. CHECK-023

9. CHECK-024

10. CHECK-025

11. CHECK-027

12. CHECK-028

13. CHECK-029

14. CHECK-032

15. CHECK-034

16. CHECK-037

17. CHECK-038

18. CHECK-039

19. CHECK-040

20. CHECK-041

21. CHECK-042

22. CHECK-043

23. CHECK-052

24. CHECK-059

25. CHECK-070

26. CHECK-071

27. CHECK-075

28. CHECK-078

**historical_source_refs**

1. memory/business-rules.json#BR-010

**来源映射**：memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-081 客户时长单位

**标识**：DFIELD-081

**名称**：客户时长单位

**entity**：CallResult

**存储语义键**：durationUnit

**类型**：string

**格式**：只有可信明确单位才换算秒；目标生产字段/单位未核不得判定。

**允许为空**：True

**必填条件**：按秒判定前必须可信

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 只有可信明确单位才换算秒；目标生产字段/单位未核不得判定。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：只有可信明确单位才换算秒；目标生产字段/单位未核不得判定。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：external

**rule**：只有可信明确单位才换算秒；目标生产字段/单位未核不得判定。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**business_rule_ids**

1. BR-010

**示例**

**valid**

1. 按“按秒判定前必须可信”及本字段格式填写/取得合成客户时长单位

**invalid**

1. 缺必需客户时长单位、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-004

2. CHECK-014

3. CHECK-015

4. CHECK-018

5. CHECK-019

6. CHECK-021

7. CHECK-022

8. CHECK-023

9. CHECK-024

10. CHECK-025

11. CHECK-027

12. CHECK-028

13. CHECK-029

14. CHECK-032

15. CHECK-034

16. CHECK-037

17. CHECK-038

18. CHECK-039

19. CHECK-040

20. CHECK-041

21. CHECK-042

22. CHECK-043

23. CHECK-052

24. CHECK-059

25. CHECK-070

26. CHECK-071

27. CHECK-075

28. CHECK-078

**historical_source_refs**

1. memory/business-rules.json#BR-010

**来源映射**：memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-082 真实客户接听

**标识**：DFIELD-082

**名称**：真实客户接听

**entity**：CallResult

**存储语义键**：customerAnswered

**类型**：boolean or null

**格式**：true/false需可信，未知null；坐席接通不等客户接听。

**允许为空**：True

**必填条件**：每次准确客户call

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. true/false需可信，未知null；坐席接通不等客户接听。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：true/false需可信，未知null；坐席接通不等客户接听。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：true/false需可信，未知null；坐席接通不等客户接听。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**business_rule_ids**

1. BR-010

**示例**

**valid**

1. 按“每次准确客户call”及本字段格式填写/取得合成真实客户接听

**invalid**

1. 缺必需真实客户接听、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-004

2. CHECK-014

3. CHECK-015

4. CHECK-018

5. CHECK-019

6. CHECK-021

7. CHECK-022

8. CHECK-023

9. CHECK-024

10. CHECK-025

11. CHECK-027

12. CHECK-028

13. CHECK-029

14. CHECK-032

15. CHECK-034

16. CHECK-037

17. CHECK-038

18. CHECK-039

19. CHECK-040

20. CHECK-041

21. CHECK-042

22. CHECK-043

23. CHECK-052

24. CHECK-059

25. CHECK-070

26. CHECK-071

27. CHECK-075

28. CHECK-078

**historical_source_refs**

1. memory/business-rules.json#BR-010

**来源映射**：memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-083 客户主动挂断

**标识**：DFIELD-083

**名称**：客户主动挂断

**entity**：CallResult

**存储语义键**：customerHungUp

**类型**：boolean or null

**格式**：原挂断枚举可信映射true/false，未核null。

**允许为空**：True

**必填条件**：每次准确客户call

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 原挂断枚举可信映射true/false，未核null。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：原挂断枚举可信映射true/false，未核null。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：原挂断枚举可信映射true/false，未核null。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**business_rule_ids**

1. BR-010

**示例**

**valid**

1. 按“每次准确客户call”及本字段格式填写/取得合成客户主动挂断

**invalid**

1. 缺必需客户主动挂断、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-004

2. CHECK-014

3. CHECK-015

4. CHECK-018

5. CHECK-019

6. CHECK-021

7. CHECK-022

8. CHECK-023

9. CHECK-024

10. CHECK-025

11. CHECK-027

12. CHECK-028

13. CHECK-029

14. CHECK-032

15. CHECK-034

16. CHECK-037

17. CHECK-038

18. CHECK-039

19. CHECK-040

20. CHECK-041

21. CHECK-042

22. CHECK-043

23. CHECK-052

24. CHECK-059

25. CHECK-070

26. CHECK-071

27. CHECK-075

28. CHECK-078

**historical_source_refs**

1. memory/business-rules.json#BR-010

**来源映射**：memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-084 秒挂三态

**标识**：DFIELD-084

**名称**：秒挂三态

**entity**：CallResult

**存储语义键**：shortHangup

**类型**：boolean or null

**格式**：整体真实关联冲突先待核；接听/客户挂断/0..2秒任一可信false即非秒挂；全true秒挂；无false且unknown待核。真实0/2计入，null不等false。无重提。

**允许为空**：True

**必填条件**：准确客户call判定

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 整体真实关联冲突先待核；接听/客户挂断/0..2秒任一可信false即非秒挂；全true秒挂；无false且unknown待核。真实0/2计入，null不等false。无重提。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：准确首次结果

**行为**：保存原证据和本方判定；整体可信矛盾先待核。

#### 2

**state**：可信晚更新

**行为**：同对象更新字段/版本并重新按完整三态判据计算，原供应商结果继续留存。

#### 3

**state**：重复/未知来源

**行为**：重复不新建结果；未知隔离保留，不生成计划/重提。

**派生规则**

**kind**：calculated

**rule**：整体真实关联冲突先待核；接听/客户挂断/0..2秒任一可信false即非秒挂；全true秒挂；无false且unknown待核。真实0/2计入，null不等false。无重提。

**dependencies**

1. DFIELD-082

2. DFIELD-083

3. DFIELD-080

4. DFIELD-081

5. DFIELD-062

**保存**

**kind**：stored

**保存时机**：准确可信结果首次关联时保存本地结果与判据；同一对象有可信新证据时保存新本地版本/派生三态，纯重复不增版本或呼叫。未可信SIP隔离，不改已确认非SIP事实。

**来源**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**business_rule_ids**

1. BR-010

2. BR-011

**示例**

**valid**

1. 接听true/客户挂断true/可信0秒 => 秒挂

2. false/null/null => 非秒挂

3. true/true/未知时长 => 待核

**invalid**

1. 缺时长补0、负时长按0、用坐席时长 => 禁止

2. 未全部true便一律非秒挂 => 错误

**验证引用**

1. CHECK-002

2. CHECK-004

3. CHECK-014

4. CHECK-015

5. CHECK-016

6. CHECK-018

7. CHECK-019

8. CHECK-021

9. CHECK-022

10. CHECK-023

11. CHECK-024

12. CHECK-025

13. CHECK-026

14. CHECK-027

15. CHECK-028

16. CHECK-029

17. CHECK-032

18. CHECK-034

19. CHECK-035

20. CHECK-036

21. CHECK-037

22. CHECK-038

23. CHECK-039

24. CHECK-040

25. CHECK-041

26. CHECK-042

27. CHECK-043

28. CHECK-052

29. CHECK-059

30. CHECK-061

31. CHECK-062

32. CHECK-066

33. CHECK-067

34. CHECK-070

35. CHECK-071

36. CHECK-072

37. CHECK-073

38. CHECK-075

39. CHECK-077

40. CHECK-078

**historical_source_refs**

1. memory/business-rules.json#BR-010

2. memory/business-rules.json#BR-011

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-085 秒挂依据

**标识**：DFIELD-085

**名称**：秒挂依据

**entity**：CallResult

**存储语义键**：shortEvidence

**类型**：object

**格式**：保三条件可信度、原字段与判据/版本；原话单分别留存，可信晚更同对象更新，无新call/plan。

**允许为空**：False

**必填条件**：三态保存

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 保三条件可信度、原字段与判据/版本；原话单分别留存，可信晚更同对象更新，无新call/plan。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：准确首次结果

**行为**：保存原证据和本方判定；整体可信矛盾先待核。

#### 2

**state**：可信晚更新

**行为**：同对象更新字段/版本并重新按完整三态判据计算，原供应商结果继续留存。

#### 3

**state**：重复/未知来源

**行为**：重复不新建结果；未知隔离保留，不生成计划/重提。

**派生规则**

**kind**：system

**rule**：保三条件可信度、原字段与判据/版本；原话单分别留存，可信晚更同对象更新，无新call/plan。

**dependencies**



**保存**

**kind**：stored

**保存时机**：准确可信结果首次关联时保存本地结果与判据；同一对象有可信新证据时保存新本地版本/派生三态，纯重复不增版本或呼叫。未可信SIP隔离，不改已确认非SIP事实。

**来源**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-010

2. BR-011

3. BR-019

**示例**

**valid**

1. 按“三态保存”及本字段格式填写/取得合成秒挂依据

**invalid**

1. 缺必需秒挂依据、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-002

2. CHECK-004

3. CHECK-008

4. CHECK-011

5. CHECK-012

6. CHECK-013

7. CHECK-014

8. CHECK-015

9. CHECK-016

10. CHECK-018

11. CHECK-019

12. CHECK-020

13. CHECK-021

14. CHECK-022

15. CHECK-023

16. CHECK-024

17. CHECK-025

18. CHECK-026

19. CHECK-027

20. CHECK-028

21. CHECK-029

22. CHECK-031

23. CHECK-032

24. CHECK-034

25. CHECK-035

26. CHECK-036

27. CHECK-037

28. CHECK-038

29. CHECK-039

30. CHECK-040

31. CHECK-041

32. CHECK-042

33. CHECK-043

34. CHECK-046

35. CHECK-052

36. CHECK-059

37. CHECK-061

38. CHECK-062

39. CHECK-063

40. CHECK-064

41. CHECK-065

42. CHECK-066

43. CHECK-067

44. CHECK-068

45. CHECK-070

46. CHECK-071

47. CHECK-072

48. CHECK-073

49. CHECK-074

50. CHECK-075

51. CHECK-076

52. CHECK-077

53. CHECK-078

54. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-010

2. memory/business-rules.json#BR-011

3. memory/business-rules.json#BR-019

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-086 本地结果号

**标识**：DFIELD-086

**名称**：本地结果号

**entity**：BusinessResult

**存储语义键**：resultId

**类型**：string

**格式**：同结果稳定标识，重复复用，正式业务系统回调字段为建议非供应商现有字段。

**允许为空**：False

**必填条件**：准确结果保存

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 同结果稳定标识，重复复用，正式业务系统回调字段为建议非供应商现有字段。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：准确首次结果

**行为**：保存原证据和本方判定；整体可信矛盾先待核。

#### 2

**state**：可信晚更新

**行为**：同对象更新字段/版本并重新按完整三态判据计算，原供应商结果继续留存。

#### 3

**state**：重复/未知来源

**行为**：重复不新建结果；未知隔离保留，不生成计划/重提。

**派生规则**

**kind**：system

**rule**：同结果稳定标识，重复复用，正式业务系统回调字段为建议非供应商现有字段。

**dependencies**



**保存**

**kind**：stored

**保存时机**：准确可信结果首次关联时保存本地结果与判据；同一对象有可信新证据时保存新本地版本/派生三态，纯重复不增版本或呼叫。未可信SIP隔离，不改已确认非SIP事实。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-015

2. BR-017

**示例**

**valid**

1. 按“准确结果保存”及本字段格式填写/取得合成本地结果号

**invalid**

1. 缺必需本地结果号、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-015

2. memory/business-rules.json#BR-017

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-087 本地结果版本

**标识**：DFIELD-087

**名称**：本地结果版本

**entity**：BusinessResult

**存储语义键**：version

**类型**：ordered version

**格式**：可信新证据升级原对象版本，纯重复不新建；正式并发/ACK版本协议待核。

**允许为空**：False

**必填条件**：结果及可信更新

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 可信新证据升级原对象版本，纯重复不新建；正式并发/ACK版本协议待核。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：准确首次结果

**行为**：保存原证据和本方判定；整体可信矛盾先待核。

#### 2

**state**：可信晚更新

**行为**：同对象更新字段/版本并重新按完整三态判据计算，原供应商结果继续留存。

#### 3

**state**：重复/未知来源

**行为**：重复不新建结果；未知隔离保留，不生成计划/重提。

**派生规则**

**kind**：system

**rule**：可信新证据升级原对象版本，纯重复不新建；正式并发/ACK版本协议待核。

**dependencies**



**保存**

**kind**：stored

**保存时机**：准确可信结果首次关联时保存本地结果与判据；同一对象有可信新证据时保存新本地版本/派生三态，纯重复不增版本或呼叫。未可信SIP隔离，不改已确认非SIP事实。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-015

2. BR-017

**示例**

**valid**

1. 按“结果及可信更新”及本字段格式填写/取得合成本地结果版本

**invalid**

1. 缺必需本地结果版本、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-015

2. memory/business-rules.json#BR-017

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-088 结果阶段

**标识**：DFIELD-088

**名称**：结果阶段

**entity**：BusinessResult

**存储语义键**：stage

**类型**：enum

**格式**：本地校验/供应商导入/真实呼叫/本方处理分开，导入拒绝不进预测失败策略。

**允许为空**：False

**必填条件**：保存/展示

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 本地校验/供应商导入/真实呼叫/本方处理分开，导入拒绝不进预测失败策略。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：本地校验/供应商导入/真实呼叫/本方处理分开，导入拒绝不进预测失败策略。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：本地校验/供应商导入/真实呼叫/本方处理分开，导入拒绝不进预测失败策略。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-004

2. BR-008

3. BR-018

**示例**

**valid**

1. 按“保存/展示”及本字段格式填写/取得合成结果阶段

**invalid**

1. 缺必需结果阶段、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-017

17. CHECK-018

18. CHECK-019

19. CHECK-020

20. CHECK-023

21. CHECK-025

22. CHECK-026

23. CHECK-027

24. CHECK-028

25. CHECK-029

26. CHECK-030

27. CHECK-031

28. CHECK-032

29. CHECK-033

30. CHECK-035

31. CHECK-036

32. CHECK-037

33. CHECK-038

34. CHECK-039

35. CHECK-040

36. CHECK-041

37. CHECK-042

38. CHECK-043

39. CHECK-045

40. CHECK-046

41. CHECK-047

42. CHECK-048

43. CHECK-049

44. CHECK-050

45. CHECK-051

46. CHECK-052

47. CHECK-056

48. CHECK-057

49. CHECK-058

50. CHECK-059

51. CHECK-060

52. CHECK-062

53. CHECK-063

54. CHECK-064

55. CHECK-065

56. CHECK-066

57. CHECK-067

58. CHECK-068

59. CHECK-069

60. CHECK-070

61. CHECK-071

62. CHECK-072

63. CHECK-073

64. CHECK-074

65. CHECK-075

66. CHECK-076

67. CHECK-077

68. CHECK-078

69. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-004

2. memory/business-rules.json#BR-008

3. memory/business-rules.json#BR-018

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-089 应用业务回调进度

**标识**：DFIELD-089

**名称**：应用业务回调进度

**entity**：ApplicationDelivery

**存储语义键**：state

**类型**：enum

**格式**：待交付/已确认/待补送/未知为候选状态；所有精确应用接口记录含DCC/天网及人工方式适用。无接入应用的手工UI不创建交付；来源/归属不足待核。 完成沟通事件复用此进度，独立于本地保存状态；业务编码等资料缺失为待交付原因“资料待完善”，正式状态码尚待确认，不能报完整成功。 完成沟通ACK必须对应完成事件及其快照/保存版本，不复用另一类型事件的确认；字段名/返回格式仍为提案。

**允许为空**：True

**必填条件**：准确应用接口来源每次结果/进度事件，或可靠保存后的完成沟通事件。

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 待交付/已确认/待补送/未知为候选状态；所有精确应用接口记录含DCC/天网及人工方式适用。无接入应用的手工UI不创建交付；来源/归属不足待核。 完成沟通事件复用此进度，独立于本地保存状态；业务编码等资料缺失为待交付原因“资料待完善”，正式状态码尚待确认，不能报完整成功。 完成沟通ACK必须对应完成事件及其快照/保存版本，不复用另一类型事件的确认；字段名/返回格式仍为提案。

2. 不以默认值、显示名或历史最近值补齐真实关联；未适用字段不伪造。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：本地结果已保存

**行为**：待交付/已确认/待补送/未知为候选状态；所有精确应用接口记录含DCC/天网及人工方式适用。无接入应用的手工UI不创建交付；来源/归属不足待核。

#### 2

**state**：ACK到达

**行为**：保原ACK；错ID/旧版/HTTP成功但无业务确认不确认当前版本。

#### 3

**state**：失败/未知/补送

**行为**：同结果同版本继续交付，不改变原来源/不新增供应商导入或预算用量。

#### 4

**state**：完成快照保存/缺码待完善

**行为**：已保存事实保留；完成事件待交付原因可为资料待完善，普通回调与完成事件各自版本进度独立。

**派生规则**

**kind**：system

**rule**：待交付/已确认/待补送/未知为候选状态；所有精确应用接口记录含DCC/天网及人工方式适用。无接入应用的手工UI不创建交付；来源/归属不足待核。 完成沟通事件复用此进度，独立于本地保存状态；业务编码等资料缺失为待交付原因“资料待完善”，正式状态码尚待确认，不能报完整成功。 完成沟通ACK必须对应完成事件及其快照/保存版本，不复用另一类型事件的确认；字段名/返回格式仍为提案。

**dependencies**



**保存**

**kind**：stored

**保存时机**：DLOCAL-010创建普通结果/进度事件或DLOCAL-COMPLETION-CALLBACK从本次可靠保存创建完成事件后，按原app/tenant+事件类型/标识/版本保存交付及ACK。普通结果号/版本与完成快照call/保存版本不可混淆；缺业务码标待完善，失败/未知保持该事件，补送不重做业务。正式事件键及ACK字段待审。

**来源**：memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-075, memory/project-facts.json, memory/normalized-user-stories.json#AC-095, memory/normalized-user-stories.json#AC-096, memory/normalized-user-stories.json#AC-097, memory/normalized-user-stories.json#AC-098, inputs/source-index.json#SRC-123

**business_rule_ids**

1. BR-017

**示例**

**valid**

1. 准确原应用/tenant/业务结果和当前版本下的应用业务回调进度

**invalid**

1. 把另一应用/tenant/结果的证据用作当前确认：拒绝且不覆盖原状态。

**验证引用**

1. CHECK-018

2. CHECK-037

3. CHECK-071

4. CHECK-075

5. CHECK-095

6. CHECK-096

7. CHECK-097

8. CHECK-098

**historical_source_refs**

1. memory/business-rules.json#BR-017

**来源映射**：memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-075, memory/project-facts.json, memory/normalized-user-stories.json#AC-095, memory/normalized-user-stories.json#AC-096, memory/normalized-user-stories.json#AC-097, memory/normalized-user-stories.json#AC-098, inputs/source-index.json#SRC-123

**状态**：current_draft_definition_not_formal_contract

**compatibility_note**：原DccDelivery字段ID保持；语义扩展至全部接入应用，正式存储迁移待工程。 复用字段语义承接普通结果/进度和完成沟通两类事件，数据记录按原app/tenant+事件类型/事件标识/版本区分，不能由普通结果ACK确认完成事件；实际键/协议待审。

#### DFIELD-090 业务系统接收确认

**标识**：DFIELD-090

**名称**：业务系统接收确认

**entity**：ApplicationDelivery

**存储语义键**：ack

**类型**：object

**格式**：正式各业务系统ACK仍missing；候选匹配原app/tenant/resultId/version并可靠接收。HTTP200、错ID或旧版不确认当前版；重送仅同结果，不重导/分配/拨号。 完成沟通ACK必须对应完成事件及其快照/保存版本，不复用另一类型事件的确认；字段名/返回格式仍为提案。

**允许为空**：True

**必填条件**：存在实际回调响应时

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 正式各业务系统ACK仍missing；候选匹配原app/tenant/resultId/version并可靠接收。HTTP200、错ID或旧版不确认当前版；重送仅同结果，不重导/分配/拨号。 完成沟通ACK必须对应完成事件及其快照/保存版本，不复用另一类型事件的确认；字段名/返回格式仍为提案。

2. 不以默认值、显示名或历史最近值补齐真实关联；未适用字段不伪造。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：本地结果已保存

**行为**：正式各业务系统ACK仍missing；候选匹配原app/tenant/resultId/version并可靠接收。HTTP200、错ID或旧版不确认当前版；重送仅同结果，不重导/分配/拨号。

#### 2

**state**：ACK到达

**行为**：保原ACK；错ID/旧版/HTTP成功但无业务确认不确认当前版本。

#### 3

**state**：失败/未知/补送

**行为**：同结果同版本继续交付，不改变原来源/不新增供应商导入或预算用量。

**派生规则**

**kind**：external

**rule**：正式各业务系统ACK仍missing；候选匹配原app/tenant/resultId/version并可靠接收。HTTP200、错ID或旧版不确认当前版；重送仅同结果，不重导/分配/拨号。 完成沟通ACK必须对应完成事件及其快照/保存版本，不复用另一类型事件的确认；字段名/返回格式仍为提案。

**dependencies**



**保存**

**kind**：stored

**保存时机**：DLOCAL-010创建普通结果/进度事件或DLOCAL-COMPLETION-CALLBACK从本次可靠保存创建完成事件后，按原app/tenant+事件类型/标识/版本保存交付及ACK。普通结果号/版本与完成快照call/保存版本不可混淆；缺业务码标待完善，失败/未知保持该事件，补送不重做业务。正式事件键及ACK字段待审。

**来源**：memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-075, memory/project-facts.json, memory/normalized-user-stories.json#AC-095, memory/normalized-user-stories.json#AC-096, memory/normalized-user-stories.json#AC-097, memory/normalized-user-stories.json#AC-098, inputs/source-index.json#SRC-123

**business_rule_ids**

1. BR-017

**示例**

**valid**

1. 准确原应用/tenant/业务结果和当前版本下的业务系统接收确认

**invalid**

1. 把另一应用/tenant/结果的证据用作当前确认：拒绝且不覆盖原状态。

**验证引用**

1. CHECK-018

2. CHECK-037

3. CHECK-071

4. CHECK-075

5. CHECK-095

6. CHECK-096

7. CHECK-097

8. CHECK-098

**historical_source_refs**

1. memory/business-rules.json#BR-017

**来源映射**：memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-075, memory/project-facts.json, memory/normalized-user-stories.json#AC-095, memory/normalized-user-stories.json#AC-096, memory/normalized-user-stories.json#AC-097, memory/normalized-user-stories.json#AC-098, inputs/source-index.json#SRC-123

**状态**：current_draft_definition_not_formal_contract

**compatibility_note**：原DccDelivery字段ID保持；语义扩展至全部接入应用，正式存储迁移待工程。 复用字段语义承接普通结果/进度和完成沟通两类事件，数据记录按原app/tenant+事件类型/事件标识/版本区分，不能由普通结果ACK确认完成事件；实际键/协议待审。

#### DFIELD-091 本次应用回调接收端

**标识**：DFIELD-091

**名称**：本次应用回调接收端

**entity**：ApplicationDelivery

**存储语义键**：target

**类型**：server configuration

**格式**：取原应用已保存callbackUrl，保准确tenant/业务记录归属；导入报文不可传临时URL，不退回旧固定DCC或其他app地址。变更后的积压取值与删除/解除关联处置待核。

**允许为空**：True

**必填条件**：应用接口结果交付前，缺配置不可发

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 取原应用已保存callbackUrl，保准确tenant/业务记录归属；导入报文不可传临时URL，不退回旧固定DCC或其他app地址。变更后的积压取值与删除/解除关联处置待核。

2. 不以默认值、显示名或历史最近值补齐真实关联；未适用字段不伪造。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：取原应用已保存callbackUrl，保准确tenant/业务记录归属；导入报文不可传临时URL，不退回旧固定DCC或其他app地址。变更后的积压取值与删除/解除关联处置待核。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：取原应用已保存callbackUrl，保准确tenant/业务记录归属；导入报文不可传临时URL，不退回旧固定DCC或其他app地址。变更后的积压取值与删除/解除关联处置待核。

**dependencies**

1. DFIELD-041

2. DFIELD-108

**保存**

**kind**：stored

**保存时机**：当精确结果准备交付时，记录实际采用的原应用配置地址及配置版本/选址证据为候选设计；地址变更后积压选址未确认前保持待核，不擅用其他地址。 同样适用于完成沟通事件，取快照中原应用身份并留选址证据，不能按复用业务批次或当前坐席选接收方。

**来源**：memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-084, memory/normalized-user-stories.json#AC-086, memory/normalized-user-stories.json#AC-092, memory/project-facts.json, memory/normalized-user-stories.json#AC-095, memory/normalized-user-stories.json#AC-096, memory/normalized-user-stories.json#AC-097, memory/normalized-user-stories.json#AC-098, inputs/source-index.json#SRC-123

**business_rule_ids**

1. BR-017

**示例**

**valid**

1. 准确原应用/tenant/业务结果和当前版本下的本次应用回调接收端

**invalid**

1. 把另一应用/tenant/结果的证据用作当前确认：拒绝且不覆盖原状态。

**验证引用**

1. CHECK-018

2. CHECK-037

3. CHECK-084

4. CHECK-086

5. CHECK-092

6. CHECK-095

7. CHECK-096

8. CHECK-097

9. CHECK-098

**historical_source_refs**

1. memory/business-rules.json#BR-017

**来源映射**：memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-084, memory/normalized-user-stories.json#AC-086, memory/normalized-user-stories.json#AC-092, memory/project-facts.json, memory/normalized-user-stories.json#AC-095, memory/normalized-user-stories.json#AC-096, memory/normalized-user-stories.json#AC-097, memory/normalized-user-stories.json#AC-098, inputs/source-index.json#SRC-123

**状态**：current_draft_definition_not_formal_contract

**compatibility_note**：原DccDelivery字段ID保持；语义扩展至全部接入应用，正式存储迁移待工程。 复用字段语义承接普通结果/进度和完成沟通两类事件，数据记录按原app/tenant+事件类型/事件标识/版本区分，不能由普通结果ACK确认完成事件；实际键/协议待审。

#### DFIELD-092 53分片声明

**标识**：DFIELD-092

**名称**：53分片声明

**entity**：FailureFragments

**存储语义键**：counts

**类型**：object

**格式**：分别保totalBatchCount/currentBatchCount/totalFailedCount；片号不是业务batch，收齐仅声明组不等全导入终态；未收到不补零失败。

**允许为空**：True

**必填条件**：53携带字段时

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 分别保totalBatchCount/currentBatchCount/totalFailedCount；片号不是业务batch，收齐仅声明组不等全导入终态；未收到不补零失败。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：分别保totalBatchCount/currentBatchCount/totalFailedCount；片号不是业务batch，收齐仅声明组不等全导入终态；未收到不补零失败。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：external

**rule**：分别保totalBatchCount/currentBatchCount/totalFailedCount；片号不是业务batch，收齐仅声明组不等全导入终态；未收到不补零失败。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**business_rule_ids**

1. BR-018

**示例**

**valid**

1. 按“53携带字段时”及本字段格式填写/取得合成53分片声明

**invalid**

1. 缺必需53分片声明、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-002

2. CHECK-003

3. CHECK-004

4. CHECK-008

5. CHECK-011

6. CHECK-012

7. CHECK-013

8. CHECK-014

9. CHECK-015

10. CHECK-018

11. CHECK-019

12. CHECK-020

13. CHECK-023

14. CHECK-025

15. CHECK-028

16. CHECK-029

17. CHECK-031

18. CHECK-032

19. CHECK-033

20. CHECK-035

21. CHECK-037

22. CHECK-038

23. CHECK-039

24. CHECK-040

25. CHECK-041

26. CHECK-042

27. CHECK-043

28. CHECK-046

29. CHECK-052

30. CHECK-059

31. CHECK-062

32. CHECK-063

33. CHECK-064

34. CHECK-066

35. CHECK-067

36. CHECK-070

37. CHECK-071

38. CHECK-073

39. CHECK-075

40. CHECK-078

**historical_source_refs**

1. memory/business-rules.json#BR-018

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-093 53失败原项

**标识**：DFIELD-093

**名称**：53失败原项

**entity**：FailureFragments

**存储语义键**：failedRows

**类型**：array or encoded raw value

**格式**：保failedTelList/原导入数据/failedReason；按核实enterprise、原task、actualfileId、原号码唯一关联，编码/类型按目标契约。

**允许为空**：True

**必填条件**：53携带时

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 保failedTelList/原导入数据/failedReason；按核实enterprise、原task、actualfileId、原号码唯一关联，编码/类型按目标契约。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：保failedTelList/原导入数据/failedReason；按核实enterprise、原task、actualfileId、原号码唯一关联，编码/类型按目标契约。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：external

**rule**：保failedTelList/原导入数据/failedReason；按核实enterprise、原task、actualfileId、原号码唯一关联，编码/类型按目标契约。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**business_rule_ids**

1. BR-018

**示例**

**valid**

1. 按“53携带时”及本字段格式填写/取得合成53失败原项

**invalid**

1. 缺必需53失败原项、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-002

2. CHECK-003

3. CHECK-004

4. CHECK-008

5. CHECK-011

6. CHECK-012

7. CHECK-013

8. CHECK-014

9. CHECK-015

10. CHECK-018

11. CHECK-019

12. CHECK-020

13. CHECK-023

14. CHECK-025

15. CHECK-028

16. CHECK-029

17. CHECK-031

18. CHECK-032

19. CHECK-033

20. CHECK-035

21. CHECK-037

22. CHECK-038

23. CHECK-039

24. CHECK-040

25. CHECK-041

26. CHECK-042

27. CHECK-043

28. CHECK-046

29. CHECK-052

30. CHECK-059

31. CHECK-062

32. CHECK-063

33. CHECK-064

34. CHECK-066

35. CHECK-067

36. CHECK-070

37. CHECK-071

38. CHECK-073

39. CHECK-075

40. CHECK-078

**historical_source_refs**

1. memory/business-rules.json#BR-018

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-094 分片完整性

**标识**：DFIELD-094

**名称**：分片完整性

**entity**：FailureFragments

**存储语义键**：completeness

**类型**：enum

**格式**：声明已齐/未齐/未知/冲突分开，去重账不随明细下载清除。

**允许为空**：False

**必填条件**：53保存后

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 声明已齐/未齐/未知/冲突分开，去重账不随明细下载清除。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：声明已齐/未齐/未知/冲突分开，去重账不随明细下载清除。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：external

**rule**：声明已齐/未齐/未知/冲突分开，去重账不随明细下载清除。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-018

2. BR-019

**示例**

**valid**

1. 按“53保存后”及本字段格式填写/取得合成分片完整性

**invalid**

1. 缺必需分片完整性、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-002

2. CHECK-003

3. CHECK-004

4. CHECK-008

5. CHECK-011

6. CHECK-012

7. CHECK-013

8. CHECK-014

9. CHECK-015

10. CHECK-016

11. CHECK-018

12. CHECK-019

13. CHECK-020

14. CHECK-023

15. CHECK-024

16. CHECK-025

17. CHECK-026

18. CHECK-027

19. CHECK-028

20. CHECK-029

21. CHECK-031

22. CHECK-032

23. CHECK-033

24. CHECK-035

25. CHECK-037

26. CHECK-038

27. CHECK-039

28. CHECK-040

29. CHECK-041

30. CHECK-042

31. CHECK-043

32. CHECK-046

33. CHECK-052

34. CHECK-059

35. CHECK-061

36. CHECK-062

37. CHECK-063

38. CHECK-064

39. CHECK-065

40. CHECK-066

41. CHECK-067

42. CHECK-068

43. CHECK-070

44. CHECK-071

45. CHECK-072

46. CHECK-073

47. CHECK-074

48. CHECK-075

49. CHECK-076

50. CHECK-077

51. CHECK-078

52. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-018

2. memory/business-rules.json#BR-019

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-095 失败固定快照

**标识**：DFIELD-095

**名称**：失败固定快照

**entity**：FailureExport

**存储语义键**：snapshot

**类型**：object

**格式**：绑定本次准确tenant/task和失败集合及已知完整性，后到新失败另下次，已导出同事件重复不再生。ID/摘要协议待工程。

**允许为空**：False

**必填条件**：生成下载时

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 绑定本次准确tenant/task和失败集合及已知完整性，后到新失败另下次，已导出同事件重复不再生。ID/摘要协议待工程。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：建立快照

**行为**：冻结准确tenant/task/成员和已知完整性，随后生成对应文件。

#### 2

**state**：写入/等待确认

**行为**：快照成员不变；失败/取消/未知保留本次快照。

#### 3

**state**：晚到新失败

**行为**：新对象进入后续可导出集合，不加入旧快照；已导出同事件重复不再生。

#### 4

**state**：可信完成清理

**行为**：只清该冻结集合对应失败明细/文件，保快照审计、事件去重及必要业务账，不清其他集合。

**派生规则**

**kind**：system

**rule**：绑定本次准确tenant/task和失败集合及已知完整性，后到新失败另下次，已导出同事件重复不再生。ID/摘要协议待工程。

**dependencies**



**保存**

**kind**：stored

**保存时机**：有原下载权限且准确范围核验后，在本次快照建立时固定snapshotId/范围/失败成员及当时已知分片完整性。生成后成员集合不可被后到新失败改写；完成清理仅作用该固定集合。

**来源**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-005

2. BR-019

**示例**

**valid**

1. 按“生成下载时”及本字段格式填写/取得合成失败固定快照

**invalid**

1. 缺必需失败固定快照、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-002

2. CHECK-004

3. CHECK-008

4. CHECK-011

5. CHECK-012

6. CHECK-013

7. CHECK-014

8. CHECK-015

9. CHECK-016

10. CHECK-017

11. CHECK-018

12. CHECK-019

13. CHECK-020

14. CHECK-023

15. CHECK-024

16. CHECK-025

17. CHECK-026

18. CHECK-027

19. CHECK-028

20. CHECK-029

21. CHECK-031

22. CHECK-032

23. CHECK-035

24. CHECK-037

25. CHECK-038

26. CHECK-039

27. CHECK-040

28. CHECK-041

29. CHECK-042

30. CHECK-043

31. CHECK-045

32. CHECK-046

33. CHECK-052

34. CHECK-056

35. CHECK-057

36. CHECK-058

37. CHECK-059

38. CHECK-061

39. CHECK-062

40. CHECK-063

41. CHECK-064

42. CHECK-065

43. CHECK-066

44. CHECK-067

45. CHECK-068

46. CHECK-070

47. CHECK-071

48. CHECK-072

49. CHECK-073

50. CHECK-074

51. CHECK-075

52. CHECK-076

53. CHECK-077

54. CHECK-078

55. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-005

2. memory/business-rules.json#BR-019

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-096 文件保存进度

**标识**：DFIELD-096

**名称**：文件保存进度

**entity**：FailureExport

**存储语义键**：downloadState

**类型**：enum

**格式**：待保存/写入中/可信完成/失败/取消/未知，点击/生成/开始响应不算完成。受支持浏览器选位置+写入关闭回读；普通下载保留记录。

**允许为空**：False

**必填条件**：下载生命周期

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 待保存/写入中/可信完成/失败/取消/未知，点击/生成/开始响应不算完成。受支持浏览器选位置+写入关闭回读；普通下载保留记录。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：生成/点击

**行为**：仅待保存或进行中，不是完成。

#### 2

**state**：取消/失败/未知

**行为**：保快照和记录。

#### 3

**state**：受支持浏览器可信写入完成

**行为**：保存本快照完成证据，再按已核权限/版本请求清理；后端协议仍待工程验证。

**派生规则**

**kind**：system

**rule**：待保存/写入中/可信完成/失败/取消/未知，点击/生成/开始响应不算完成。受支持浏览器选位置+写入关闭回读；普通下载保留记录。

**dependencies**



**保存**

**kind**：stored

**保存时机**：选择保存/开始写入/写入关闭和回读反馈时保存当前快照状态；只有与固定快照匹配的可信完成证据才进入可清理状态。普通下载不转可信完成清理。

**来源**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-005

2. BR-019

**示例**

**valid**

1. 按“下载生命周期”及本字段格式填写/取得合成文件保存进度

**invalid**

1. 缺必需文件保存进度、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-002

2. CHECK-004

3. CHECK-008

4. CHECK-011

5. CHECK-012

6. CHECK-013

7. CHECK-014

8. CHECK-015

9. CHECK-016

10. CHECK-017

11. CHECK-018

12. CHECK-019

13. CHECK-020

14. CHECK-023

15. CHECK-024

16. CHECK-025

17. CHECK-026

18. CHECK-027

19. CHECK-028

20. CHECK-029

21. CHECK-031

22. CHECK-032

23. CHECK-035

24. CHECK-037

25. CHECK-038

26. CHECK-039

27. CHECK-040

28. CHECK-041

29. CHECK-042

30. CHECK-043

31. CHECK-045

32. CHECK-046

33. CHECK-052

34. CHECK-056

35. CHECK-057

36. CHECK-058

37. CHECK-059

38. CHECK-061

39. CHECK-062

40. CHECK-063

41. CHECK-064

42. CHECK-065

43. CHECK-066

44. CHECK-067

45. CHECK-068

46. CHECK-070

47. CHECK-071

48. CHECK-072

49. CHECK-073

50. CHECK-074

51. CHECK-075

52. CHECK-076

53. CHECK-077

54. CHECK-078

55. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-005

2. memory/business-rules.json#BR-019

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-097 保存完成证据

**标识**：DFIELD-097

**名称**：保存完成证据

**entity**：FailureExport

**存储语义键**：saveEvidence

**类型**：object

**格式**：用户已接受选保存位置后系统确认写入；已有本地合成验证，页面报告与后端身份/快照校验及真实兼容/恢复仍待工程，不以普通点击授权清理。

**允许为空**：True

**必填条件**：清理本快照前

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 用户已接受选保存位置后系统确认写入；已有本地合成验证，页面报告与后端身份/快照校验及真实兼容/恢复仍待工程，不以普通点击授权清理。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：尚未完成

**行为**：证据为空，点击/服务器开始响应不能代替。

#### 2

**state**：完成证据到达

**行为**：绑定原快照与本次下载状态，生产认证/一致性待工程。

#### 3

**state**：证据错配/未知

**行为**：保留明细，不清理；不能用后续快照的确认清旧/全量记录。

**派生规则**

**kind**：system

**rule**：用户已接受选保存位置后系统确认写入；已有本地合成验证，页面报告与后端身份/快照校验及真实兼容/恢复仍待工程，不以普通点击授权清理。

**dependencies**



**保存**

**kind**：stored

**保存时机**：受支持浏览器实际写入关闭及回读后，保存绑定当前快照的完成证据；正式后端须重新核当前授权/快照身份和版本，不能普通客户端声称完成就清理。

**来源**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-005

2. BR-019

**示例**

**valid**

1. 按“清理本快照前”及本字段格式填写/取得合成保存完成证据

**invalid**

1. 缺必需保存完成证据、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-002

2. CHECK-004

3. CHECK-008

4. CHECK-011

5. CHECK-012

6. CHECK-013

7. CHECK-014

8. CHECK-015

9. CHECK-016

10. CHECK-017

11. CHECK-018

12. CHECK-019

13. CHECK-020

14. CHECK-023

15. CHECK-024

16. CHECK-025

17. CHECK-026

18. CHECK-027

19. CHECK-028

20. CHECK-029

21. CHECK-031

22. CHECK-032

23. CHECK-035

24. CHECK-037

25. CHECK-038

26. CHECK-039

27. CHECK-040

28. CHECK-041

29. CHECK-042

30. CHECK-043

31. CHECK-045

32. CHECK-046

33. CHECK-052

34. CHECK-056

35. CHECK-057

36. CHECK-058

37. CHECK-059

38. CHECK-061

39. CHECK-062

40. CHECK-063

41. CHECK-064

42. CHECK-065

43. CHECK-066

44. CHECK-067

45. CHECK-068

46. CHECK-070

47. CHECK-071

48. CHECK-072

49. CHECK-073

50. CHECK-074

51. CHECK-075

52. CHECK-076

53. CHECK-077

54. CHECK-078

55. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-005

2. memory/business-rules.json#BR-019

3. runtime/download-save-user-decision-20261014.json

4. runtime/download-save-browser-proof-20261014.json

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-098 操作去重号

**标识**：DFIELD-098

**名称**：操作去重号

**entity**：OperatorAction

**存储语义键**：actionId

**类型**：string

**格式**：一次明确动作稳定号；每次先验权限，同ID同完整内容返原状态、异内容拒绝；不自由输入技术号。

**允许为空**：False

**必填条件**：人工重提/删除确认

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 一次明确动作稳定号；每次先验权限，同ID同完整内容返原状态、异内容拒绝；不自由输入技术号。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：选择/确认

**行为**：用户只核对已有记录，技术标识后台绑定；取消不提交有效动作。

#### 2

**state**：服务端重放检查

**行为**：同ID同内容返原结果且无副作用，异内容拒绝。

#### 3

**state**：新动作

**行为**：严格true及版本一致才能进入新命令业务守卫；之后才允许计划停止/预占/外发。

**派生规则**

**kind**：system

**rule**：一次明确动作稳定号；每次先验权限，同ID同完整内容返原状态、异内容拒绝；不自由输入技术号。

**dependencies**



**保存**

**kind**：stored

**保存时机**：前台对现有准确目标形成当前命令；服务端先验当前授权再检查action完整内容。仅新action通过严格确认/当前版本和业务守卫后保存有效动作；旧action同内容只读原执行状态。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-007

2. BR-015

3. BR-022

**示例**

**valid**

1. 按“人工重提/删除确认”及本字段格式填写/取得合成操作去重号

**invalid**

1. 缺必需操作去重号、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-007

2. memory/business-rules.json#BR-015

3. memory/business-rules.json#BR-022

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-099 目标版本

**标识**：DFIELD-099

**名称**：目标版本

**entity**：OperatorAction

**存储语义键**：expectedVersion

**类型**：stable version

**格式**：仅新action核当前版本一致，旧action同内容先重放原尝试，不因后来升版新发；具体锁方案待工程。

**允许为空**：False

**必填条件**：新操作确认

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 仅新action核当前版本一致，旧action同内容先重放原尝试，不因后来升版新发；具体锁方案待工程。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：选择/确认

**行为**：用户只核对已有记录，技术标识后台绑定；取消不提交有效动作。

#### 2

**state**：服务端重放检查

**行为**：同ID同内容返原结果且无副作用，异内容拒绝。

#### 3

**state**：新动作

**行为**：严格true及版本一致才能进入新命令业务守卫；之后才允许计划停止/预占/外发。

**派生规则**

**kind**：system

**rule**：仅新action核当前版本一致，旧action同内容先重放原尝试，不因后来升版新发；具体锁方案待工程。

**dependencies**



**保存**

**kind**：stored

**保存时机**：前台对现有准确目标形成当前命令；服务端先验当前授权再检查action完整内容。仅新action通过严格确认/当前版本和业务守卫后保存有效动作；旧action同内容只读原执行状态。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-007

2. BR-015

3. BR-022

**示例**

**valid**

1. 按“新操作确认”及本字段格式填写/取得合成目标版本

**invalid**

1. 缺必需目标版本、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-007

2. memory/business-rules.json#BR-015

3. memory/business-rules.json#BR-022

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-100 明确确认

**标识**：DFIELD-100

**名称**：明确确认

**entity**：OperatorAction

**存储语义键**：confirmed

**类型**：boolean

**格式**：必须Boolean true，新对话框false，取消不提交/不停止/不外发，不把字符串true转型。

**允许为空**：False

**必填条件**：新动作

**默认值**

**kind**：literal

**value**：False

**rule**：新动作默认未确认，用户明确确认才true。

**校验规则**

1. 必须Boolean true，新对话框false，取消不提交/不停止/不外发，不把字符串true转型。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：选择/确认

**行为**：用户只核对已有记录，技术标识后台绑定；取消不提交有效动作。

#### 2

**state**：服务端重放检查

**行为**：同ID同内容返原结果且无副作用，异内容拒绝。

#### 3

**state**：新动作

**行为**：严格true及版本一致才能进入新命令业务守卫；之后才允许计划停止/预占/外发。

**派生规则**

**kind**：input

**rule**：必须Boolean true，新对话框false，取消不提交/不停止/不外发，不把字符串true转型。

**dependencies**



**保存**

**kind**：stored

**保存时机**：前台对现有准确目标形成当前命令；服务端先验当前授权再检查action完整内容。仅新action通过严格确认/当前版本和业务守卫后保存有效动作；旧action同内容只读原执行状态。

**来源**：memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-007

2. BR-022

**示例**

**valid**

1. 按“新动作”及本字段格式填写/取得合成明确确认

**invalid**

1. 缺必需明确确认、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-004

2. CHECK-014

3. CHECK-015

4. CHECK-016

5. CHECK-017

6. CHECK-019

7. CHECK-020

8. CHECK-023

9. CHECK-024

10. CHECK-025

11. CHECK-026

12. CHECK-027

13. CHECK-028

14. CHECK-029

15. CHECK-032

16. CHECK-035

17. CHECK-036

18. CHECK-038

19. CHECK-039

20. CHECK-040

21. CHECK-041

22. CHECK-042

23. CHECK-043

24. CHECK-045

25. CHECK-052

26. CHECK-056

27. CHECK-057

28. CHECK-058

29. CHECK-059

30. CHECK-061

31. CHECK-063

32. CHECK-064

33. CHECK-065

34. CHECK-066

35. CHECK-067

36. CHECK-068

37. CHECK-070

38. CHECK-072

39. CHECK-073

40. CHECK-074

41. CHECK-076

42. CHECK-077

43. CHECK-078

44. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-007

2. memory/business-rules.json#BR-022

**来源映射**：memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-101 删除尝试号

**标识**：DFIELD-101

**名称**：删除尝试号

**entity**：SupplierDeletion

**存储语义键**：deleteAttemptId

**类型**：string

**格式**：绑定原action/record/版本/选择器，UNKNOWN沿同尝试，不换action盲发。

**允许为空**：False

**必填条件**：合法新命令保存

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 绑定原action/record/版本/选择器，UNKNOWN沿同尝试，不换action盲发。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：守卫前/取消/旧动作重放

**行为**：无新的计划停止或删除尝试；旧动作仅返回原保存状态。

#### 2

**state**：新准确授权意图

**行为**：仅该目标未执行失败计划停止，本地状态先独立保存。

#### 3

**state**：远端证据到达或UNKNOWN

**行为**：只有目标明确成功且未跳过才能标已删；未知保同attempt，不再外发/不回退本地停止。

**派生规则**

**kind**：system

**rule**：绑定原action/record/版本/选择器，UNKNOWN沿同尝试，不换action盲发。

**dependencies**



**保存**

**kind**：stored

**保存时机**：合法新action在授权、内容去重、严格确认、版本及准确目标守卫通过后，原子保存本地取消意图/停止及固定deleteAttempt；远端状态仅随后依据该同attempt实际证据更新。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-007

2. BR-015

**示例**

**valid**

1. 按“合法新命令保存”及本字段格式填写/取得合成删除尝试号

**invalid**

1. 缺必需删除尝试号、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-007

2. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-102 本地计划停止结果

**标识**：DFIELD-102

**名称**：本地计划停止结果

**entity**：SupplierDeletion

**存储语义键**：localPlanDisposition

**类型**：enum

**格式**：仅该目标未执行失败计划停止；远端结果独立。目标不明不停止不确定对象，在途不假撤回。

**允许为空**：False

**必填条件**：准确授权意图后

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 仅该目标未执行失败计划停止；远端结果独立。目标不明不停止不确定对象，在途不假撤回。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：守卫前/取消/旧动作重放

**行为**：无新的计划停止或删除尝试；旧动作仅返回原保存状态。

#### 2

**state**：新准确授权意图

**行为**：仅该目标未执行失败计划停止，本地状态先独立保存。

#### 3

**state**：远端证据到达或UNKNOWN

**行为**：只有目标明确成功且未跳过才能标已删；未知保同attempt，不再外发/不回退本地停止。

**派生规则**

**kind**：system

**rule**：仅该目标未执行失败计划停止；远端结果独立。目标不明不停止不确定对象，在途不假撤回。

**dependencies**



**保存**

**kind**：stored

**保存时机**：合法新action在授权、内容去重、严格确认、版本及准确目标守卫通过后，原子保存本地取消意图/停止及固定deleteAttempt；远端状态仅随后依据该同attempt实际证据更新。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-007

2. BR-015

**示例**

**valid**

1. 按“准确授权意图后”及本字段格式填写/取得合成本地计划停止结果

**invalid**

1. 缺必需本地计划停止结果、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-007

2. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-103 远端删除结果

**标识**：DFIELD-103

**名称**：远端删除结果

**entity**：SupplierDeletion

**存储语义键**：remoteDisposition

**类型**：enum

**格式**：未发起/成功/拒绝/目标跳过/UNKNOWN分开；result0且目标不跳过并有成功证据才已删；失败不恢复取消计划/不释放未知预算。

**允许为空**：False

**必填条件**：删除尝试

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 未发起/成功/拒绝/目标跳过/UNKNOWN分开；result0且目标不跳过并有成功证据才已删；失败不恢复取消计划/不释放未知预算。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：守卫前/取消/旧动作重放

**行为**：无新的计划停止或删除尝试；旧动作仅返回原保存状态。

#### 2

**state**：新准确授权意图

**行为**：仅该目标未执行失败计划停止，本地状态先独立保存。

#### 3

**state**：远端证据到达或UNKNOWN

**行为**：只有目标明确成功且未跳过才能标已删；未知保同attempt，不再外发/不回退本地停止。

**派生规则**

**kind**：system

**rule**：未发起/成功/拒绝/目标跳过/UNKNOWN分开；result0且目标不跳过并有成功证据才已删；失败不恢复取消计划/不释放未知预算。

**dependencies**



**保存**

**kind**：stored

**保存时机**：合法新action在授权、内容去重、严格确认、版本及准确目标守卫通过后，原子保存本地取消意图/停止及固定deleteAttempt；远端状态仅随后依据该同attempt实际证据更新。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-007

2. BR-015

**示例**

**valid**

1. 按“删除尝试”及本字段格式填写/取得合成远端删除结果

**invalid**

1. 缺必需远端删除结果、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-007

2. memory/business-rules.json#BR-015

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-104 精确删除选择器

**标识**：DFIELD-104

**名称**：精确删除选择器

**entity**：SupplierDeletion

**存储语义键**：selector

**类型**：object

**格式**：实际fileId独占该目标才候选原task+fileId且不同时tels；tels优先不是AND。共享file多attempt不可精确则不外发；skip参数未定。

**允许为空**：True

**必填条件**：外发前

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 实际fileId独占该目标才候选原task+fileId且不同时tels；tels优先不是AND。共享file多attempt不可精确则不外发；skip参数未定。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：实际fileId独占该目标才候选原task+fileId且不同时tels；tels优先不是AND。共享file多attempt不可精确则不外发；skip参数未定。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：实际fileId独占该目标才候选原task+fileId且不同时tels；tels优先不是AND。共享file多attempt不可精确则不外发；skip参数未定。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-007

**示例**

**valid**

1. 实际fileId仅包含明确目标时，用taskId+fileId候选精确删除

**invalid**

1. tels+fileId当AND、仅同号删除所有批：禁止

2. 共享fileId含多个attempt仍整批删：禁止

**验证引用**

1. CHECK-016

2. CHECK-017

3. CHECK-019

4. CHECK-020

5. CHECK-023

6. CHECK-024

7. CHECK-025

8. CHECK-026

9. CHECK-027

10. CHECK-035

11. CHECK-045

12. CHECK-052

13. CHECK-056

14. CHECK-057

15. CHECK-058

16. CHECK-061

17. CHECK-063

18. CHECK-064

19. CHECK-065

20. CHECK-066

21. CHECK-067

22. CHECK-068

23. CHECK-070

24. CHECK-072

25. CHECK-073

26. CHECK-074

27. CHECK-076

28. CHECK-077

29. CHECK-078

30. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-007

**来源映射**：memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-105 供应商跳过号码

**标识**：DFIELD-105

**名称**：供应商跳过号码

**entity**：SupplierDeletion

**存储语义键**：skippedCallingTels

**类型**：array or raw value

**格式**：核本目标是否跳过；缺失/空数组按正式协议分辨，不能result0直接当目标成功；skipRetry不保证原生重呼取消。

**允许为空**：True

**必填条件**：实际删除响应

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 核本目标是否跳过；缺失/空数组按正式协议分辨，不能result0直接当目标成功；skipRetry不保证原生重呼取消。

2. 允许null表达本字段尚未获得/不适用；空字符串不能代替已知标识或结果。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：核本目标是否跳过；缺失/空数组按正式协议分辨，不能result0直接当目标成功；skipRetry不保证原生重呼取消。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：核本目标是否跳过；缺失/空数组按正式协议分辨，不能result0直接当目标成功；skipRetry不保证原生重呼取消。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-007

**示例**

**valid**

1. 按“实际删除响应”及本字段格式填写/取得合成供应商跳过号码

**invalid**

1. 缺必需供应商跳过号码、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-016

2. CHECK-017

3. CHECK-019

4. CHECK-020

5. CHECK-023

6. CHECK-024

7. CHECK-025

8. CHECK-026

9. CHECK-027

10. CHECK-035

11. CHECK-045

12. CHECK-052

13. CHECK-056

14. CHECK-057

15. CHECK-058

16. CHECK-061

17. CHECK-063

18. CHECK-064

19. CHECK-065

20. CHECK-066

21. CHECK-067

22. CHECK-068

23. CHECK-070

24. CHECK-072

25. CHECK-073

26. CHECK-074

27. CHECK-076

28. CHECK-077

29. CHECK-078

30. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-007

**来源映射**：memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

**applicable_call_modes**

1. predictive

**范围说明**：仅已有预测导入/结果/失败/删除闭环；人工外呼分配不套用，预测转人工保原证据但新人工拨打不使用本字段新造预测对象。

#### DFIELD-106 待核原因

**标识**：DFIELD-106

**名称**：待核原因

**entity**：BusinessEvidence

**存储语义键**：reviewReasons

**类型**：array<string>

**格式**：分别保关联/来源/账/提交边界等原因，无待核可空数组；不能清空冒已验证。主界面业务措辞，原技术证据在详情。

**允许为空**：False

**必填条件**：存在未知/冲突

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 分别保关联/来源/账/提交边界等原因，无待核可空数组；不能清空冒已验证。主界面业务措辞，原技术证据在详情。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：分别保关联/来源/账/提交边界等原因，无待核可空数组；不能清空冒已验证。主界面业务措辞，原技术证据在详情。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：分别保关联/来源/账/提交边界等原因，无待核可空数组；不能清空冒已验证。主界面业务措辞，原技术证据在详情。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-015

2. BR-019

**示例**

**valid**

1. 按“存在未知/冲突”及本字段格式填写/取得合成待核原因

**invalid**

1. 缺必需待核原因、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-015

2. memory/business-rules.json#BR-019

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-107 必要去重关联留存

**标识**：DFIELD-107

**名称**：必要去重关联留存

**entity**：BusinessEvidence

**存储语义键**：dedupState

**类型**：object

**格式**：保record/source/root/fileId/call、事件/分片、plan/attempt、used/UNKNOWN占用/停止；下载清理/远端删除都不清，不自行设未确认保留期。

**允许为空**：False

**必填条件**：接收及执行后

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺失不补业务值，历史缺失不回填；不等于0/空集合/false。

**校验规则**

1. 保record/source/root/fileId/call、事件/分片、plan/attempt、used/UNKNOWN占用/停止；下载清理/远端删除都不清，不自行设未确认保留期。

2. 在required_when规定阶段禁止缺失/null；查询词空串和明确零值按本字段规则处理。

**权限**

**read**

1. 当前原租户/任务查看权限用户及受控本方服务

**write**

1. 本方服务在可信接收或明确动作阶段写入，前端不得任意改历史状态

**生命周期**

#### 1

**state**：输入/接收

**行为**：保record/source/root/fileId/call、事件/分片、plan/attempt、used/UNKNOWN占用/停止；下载清理/远端删除都不清，不自行设未确认保留期。

#### 2

**state**：确认/更新

**行为**：与准确对象保存，可信晚更新沿同一对象；重复操作不新建业务结果。

#### 3

**state**：缺失/冲突

**行为**：保留真实缺失和原证据；关键未知阻止依赖外发，不伪造成功，未知不默认零。

**派生规则**

**kind**：system

**rule**：保record/source/root/fileId/call、事件/分片、plan/attempt、used/UNKNOWN占用/停止；下载清理/远端删除都不清，不自行设未确认保留期。

**dependencies**



**保存**

**kind**：stored

**保存时机**：在本字段所属可信业务接收/明确确认动作保存；持久化原子边界和物理映射待工程评审，不因快照清理丢必要关联。

**来源**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**business_rule_ids**

1. BR-015

2. BR-019

**示例**

**valid**

1. 按“接收及执行后”及本字段格式填写/取得合成必要去重关联留存

**invalid**

1. 缺必需必要去重关联留存、使用另一租户对象或把未知冒已知：明确拒绝/待核，不能继续依赖外发

**验证引用**

1. CHECK-001

2. CHECK-002

3. CHECK-003

4. CHECK-004

5. CHECK-005

6. CHECK-006

7. CHECK-007

8. CHECK-008

9. CHECK-009

10. CHECK-010

11. CHECK-011

12. CHECK-012

13. CHECK-013

14. CHECK-014

15. CHECK-015

16. CHECK-016

17. CHECK-017

18. CHECK-018

19. CHECK-019

20. CHECK-020

21. CHECK-021

22. CHECK-022

23. CHECK-023

24. CHECK-024

25. CHECK-025

26. CHECK-026

27. CHECK-027

28. CHECK-028

29. CHECK-029

30. CHECK-030

31. CHECK-031

32. CHECK-032

33. CHECK-033

34. CHECK-034

35. CHECK-035

36. CHECK-036

37. CHECK-037

38. CHECK-038

39. CHECK-039

40. CHECK-040

41. CHECK-041

42. CHECK-042

43. CHECK-043

44. CHECK-045

45. CHECK-046

46. CHECK-047

47. CHECK-048

48. CHECK-049

49. CHECK-050

50. CHECK-051

51. CHECK-052

52. CHECK-056

53. CHECK-057

54. CHECK-058

55. CHECK-059

56. CHECK-060

57. CHECK-061

58. CHECK-062

59. CHECK-063

60. CHECK-064

61. CHECK-065

62. CHECK-066

63. CHECK-067

64. CHECK-068

65. CHECK-069

66. CHECK-070

67. CHECK-071

68. CHECK-072

69. CHECK-073

70. CHECK-074

71. CHECK-075

72. CHECK-076

73. CHECK-077

74. CHECK-078

75. CHECK-079

**historical_source_refs**

1. memory/business-rules.json#BR-015

2. memory/business-rules.json#BR-019

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**状态**：current_draft_definition_not_formal_contract

#### DFIELD-108 应用回调地址

**标识**：DFIELD-108

**名称**：应用回调地址

**entity**：Application

**存储语义键**：callbackUrl

**类型**：string

**格式**：超管维护每个应用自己的URL，支持同应用多租户结果；URL协议/长度/安全校验待定。null/空串表示未配置，不能进入导入；不从任务/报文临时地址或别的应用补值。

**允许为空**：True

**必填条件**：全部应用接口新导入前必须存在；应用无地址是否可保存草稿待审

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 超管维护每个应用自己的URL，支持同应用多租户结果；URL协议/长度/安全校验待定。null/空串表示未配置，不能进入导入；不从任务/报文临时地址或别的应用补值。

2. 空字符串不是有效标识或URL；缺失/null与明确零值、false、空集合不同；不跨租户猜配。

**权限**

**read**

1. 超管；回调服务按授权读取

**write**

1. 超管新增/修改成功时

**生命周期**

#### 1

**state**：接收/编辑

**行为**：超管维护每个应用自己的URL，支持同应用多租户结果；URL协议/长度/安全校验待定。null/空串表示未配置，不能进入导入；不从任务/报文临时地址或别的应用补值。

#### 2

**state**：保存成功

**行为**：新增/修改应用成功时与本配置保存，取消/失败保原值；变更积压选址待S4。

#### 3

**state**：校验/保存失败

**行为**：保持原已保存值，保留当次输入或证据；不生成成功副作用。

**派生规则**

**kind**：input

**rule**：超管维护每个应用自己的URL，支持同应用多租户结果；URL协议/长度/安全校验待定。null/空串表示未配置，不能进入导入；不从任务/报文临时地址或别的应用补值。

**dependencies**



**保存**

**kind**：stored

**保存时机**：新增/修改应用成功时与本配置保存，取消/失败保原值；变更积压选址待S4。

**来源**：memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-084, memory/normalized-user-stories.json#AC-086, memory/project-facts.json

**来源映射**：memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-084, memory/normalized-user-stories.json#AC-086, memory/project-facts.json

**示例**

**valid**

1. 在授权准确对象上按本字段定义保存且可回读同值。

**invalid**

1. 使用其他租户/应用对象、缺必填或伪造未知为成功：拒绝并保留原状态。

**验证引用**

1. CHECK-037

2. CHECK-054

3. CHECK-055

4. CHECK-056

5. CHECK-084

6. CHECK-086

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：产品语义与保存时点已写明；字段名、物理API/存储映射及工程验证待后续设计，未宣称真实契约可用。

**局部原型证据**

**标识**：UI-LOCAL-APPLICATION-CALLBACK-20261014

**证据**

1. prototype/memory/verification-evidence/application-callback-ui-20261014.json

**范围**：本地合成应用新增/编辑可保存callbackUrl，详情可回读；允许未配置应用先保存但合成接口导入会拒绝，手工UI导入不受该门槛影响。http(s)基础格式/禁止内嵌账号密码为本地演示校验，正式URL安全/积压选址/后端鉴权/ACK仍待核；未实现真实回调。

**full_acceptance_suite_executed**：False

**formal_gates_changed**：False

**real_calls_enabled**：False

**historical_scope_note**：此前局部证据只证明当时快照与范围；当前实现以UI-LOCAL-FULL-AUDIT-20261015为准。

**current_local_audit_ref**：UI-LOCAL-FULL-AUDIT-20261015

#### DFIELD-109 外呼方式

**标识**：DFIELD-109

**名称**：外呼方式

**entity**：ImportRecord

**存储语义键**：callMode

**类型**：string

**格式**：仅预外呼/人工外呼两种业务值；字段名、请求层级及正式枚举待S4。不得默认一种；模式决定任务组或工号分配，不决定是否回调。

**允许为空**：False

**必填条件**：接口导入每次明确指定

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 仅预外呼/人工外呼两种业务值；字段名、请求层级及正式枚举待S4。不得默认一种；模式决定任务组或工号分配，不决定是否回调。

2. 空字符串不是有效标识或URL；缺失/null与明确零值、false、空集合不同；不跨租户猜配。

**权限**

**read**

1. 授权当前租户业务用户/坐席及服务端

**write**

1. 有权操作者在所述阶段；服务端逐次校验

**生命周期**

#### 1

**state**：接收/编辑

**行为**：仅预外呼/人工外呼两种业务值；字段名、请求层级及正式枚举待S4。不得默认一种；模式决定任务组或工号分配，不决定是否回调。

#### 2

**state**：保存成功

**行为**：有效行接收时随原记录保存，技术重传保持原值，变更同requestId报冲突。

#### 3

**state**：校验/保存失败

**行为**：保持原已保存值，保留当次输入或证据；不生成成功副作用。

**派生规则**

**kind**：input

**rule**：仅预外呼/人工外呼两种业务值；字段名、请求层级及正式枚举待S4。不得默认一种；模式决定任务组或工号分配，不决定是否回调。

**dependencies**



**保存**

**kind**：stored

**保存时机**：有效行接收时随原记录保存，技术重传保持原值，变更同requestId报冲突。

**来源**：memory/normalized-user-stories.json#AC-080, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-083, memory/project-facts.json

**来源映射**：memory/normalized-user-stories.json#AC-080, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-083, memory/project-facts.json

**示例**

**valid**

1. 在授权准确对象上按本字段定义保存且可回读同值。

**invalid**

1. 使用其他租户/应用对象、缺必填或伪造未知为成功：拒绝并保留原状态。

**验证引用**

1. CHECK-080

2. CHECK-050

3. CHECK-051

4. CHECK-082

5. CHECK-083

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：产品语义与保存时点已写明；字段名、物理API/存储映射及工程验证待后续设计，未宣称真实契约可用。

#### DFIELD-110 分配坐席工号

**标识**：DFIELD-110

**名称**：分配坐席工号

**entity**：ExternalRow

**存储语义键**：agentWorkNo

**类型**：string

**格式**：人工外呼agentWorkNo选填；缺省接收且不分配云呼叫坐席、不进入个人待联系；显式提供时精确校验当前租户唯一有效坐席，错误拒绝该行，不回退成未分配或改派。预外呼仍必须传准确taskId并沿任务坐席组，工号不覆盖组分配。

**允许为空**：True

**必填条件**：选填；仅人工外呼明确提供非空工号时校验；预外呼仍任务组

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：缺省不分配云呼叫坐席，不借用当前登录人或DCC负责人；业务跟进初始未同步。

**校验规则**

1. 人工外呼agentWorkNo选填；缺省接收且不分配云呼叫坐席、不进入个人待联系；显式提供时精确校验当前租户唯一有效坐席，错误拒绝该行，不回退成未分配或改派。预外呼仍必须传准确taskId并沿任务坐席组，工号不覆盖组分配。

2. 缺省或空值不指派，字符串保留前导零；明确非空但无效/跨租户/歧义的工号不能静默降级为未分配。

**权限**

**read**

1. 授权当前租户业务用户/坐席及服务端

**write**

1. 有权操作者在所述阶段；服务端逐次校验

**生命周期**

#### 1

**state**：接收/编辑

**行为**：人工外呼agentWorkNo选填；缺省接收且不分配云呼叫坐席、不进入个人待联系；显式提供时精确校验当前租户唯一有效坐席，错误拒绝该行，不回退成未分配或改派。预外呼仍必须传准确taskId并沿任务坐席组，工号不覆盖组分配。

#### 2

**state**：保存成功

**行为**：接收有效行时保存原工号（允许缺省）及准确解析身份；明确无效工号拒绝该行，无工号保存客户但不分配。

#### 3

**state**：校验/保存失败

**行为**：保持原已保存值，保留当次输入或证据；不生成成功副作用。

**派生规则**

**kind**：input

**rule**：人工外呼agentWorkNo选填；缺省接收且不分配云呼叫坐席、不进入个人待联系；显式提供时精确校验当前租户唯一有效坐席，错误拒绝该行，不回退成未分配或改派。预外呼仍必须传准确taskId并沿任务坐席组，工号不覆盖组分配。

**dependencies**



**保存**

**kind**：stored

**保存时机**：接收有效行时保存原工号（允许缺省）及准确解析身份；明确无效工号拒绝该行，无工号保存客户但不分配。

**来源**：memory/normalized-user-stories.json#AC-080, memory/normalized-user-stories.json#AC-081, memory/normalized-user-stories.json#AC-083, memory/project-facts.json

**来源映射**：memory/normalized-user-stories.json#AC-080, memory/normalized-user-stories.json#AC-081, memory/normalized-user-stories.json#AC-083, memory/project-facts.json

**示例**

**valid**

1. 按本字段适用阶段提供准确值；人工工号例0012，实际格式以字段约定为准。

**invalid**

1. 使用其他租户/应用对象、缺必填或伪造未知为成功：拒绝并保留原状态。

**验证引用**

1. CHECK-080

2. CHECK-081

3. CHECK-083

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：产品语义与保存时点已写明；字段名、物理API/存储映射及工程验证待后续设计，未宣称真实契约可用。

#### DFIELD-111 实际分配坐席身份

**标识**：DFIELD-111

**名称**：实际分配坐席身份

**entity**：ManualAssignment

**存储语义键**：assignedAgentId

**类型**：string

**格式**：由同租户有效工号解析坐席/账号身份；账号/成员/坐席启用、同步成功且接受新任务，不要求在线才分配；预测继续跟进为当前接入坐席，不按新工号重派。

**允许为空**：True

**必填条件**：人工有效分配及继续跟进确定归属时必需

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 由同租户有效工号解析坐席/账号身份；账号/成员/坐席启用、同步成功且接受新任务，不要求在线才分配；预测继续跟进为当前接入坐席，不按新工号重派。

2. 空字符串不是有效标识或URL；缺失/null与明确零值、false、空集合不同；不跨租户猜配。

**权限**

**read**

1. 授权当前租户业务用户/坐席及服务端

**write**

1. 有权操作者在所述阶段；服务端逐次校验

**生命周期**

#### 1

**state**：接收/编辑

**行为**：由同租户有效工号解析坐席/账号身份；账号/成员/坐席启用、同步成功且接受新任务，不要求在线才分配；预测继续跟进为当前接入坐席，不按新工号重派。

#### 2

**state**：保存成功

**行为**：人工保存分配成功时绑定；预测继续跟进保存成功时绑定当前坐席并保原关联。

#### 3

**state**：校验/保存失败

**行为**：保持原已保存值，保留当次输入或证据；不生成成功副作用。

**派生规则**

**kind**：calculated

**rule**：由同租户有效工号解析坐席/账号身份；账号/成员/坐席启用、同步成功且接受新任务，不要求在线才分配；预测继续跟进为当前接入坐席，不按新工号重派。

**dependencies**

1. DFIELD-010

2. DFIELD-110

**保存**

**kind**：stored

**保存时机**：人工保存分配成功时绑定；预测继续跟进保存成功时绑定当前坐席并保原关联。

**来源**：memory/normalized-user-stories.json#AC-081, memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-083, memory/normalized-user-stories.json#AC-089, memory/project-facts.json, 需求/1.1.0/分析工作区/memory/project-facts.json#local_revision_SRC126

**来源映射**：memory/normalized-user-stories.json#AC-081, memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-083, memory/normalized-user-stories.json#AC-089, memory/project-facts.json, 需求/1.1.0/分析工作区/memory/project-facts.json#local_revision_SRC126

**示例**

**valid**

1. 在授权准确对象上按本字段定义保存且可回读同值。

**invalid**

1. 使用其他租户/应用对象、缺必填或伪造未知为成功：拒绝并保留原状态。

**验证引用**

1. CHECK-081

2. CHECK-082

3. CHECK-083

4. CHECK-089

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：产品语义与保存时点已写明；字段名、物理API/存储映射及工程验证待后续设计，未宣称真实契约可用。

**current_revision_note**：人工外呼agentWorkNo选填；缺省接收且不分配云呼叫坐席、不进入个人待联系；显式提供时精确校验当前租户唯一有效坐席，错误拒绝该行，不回退成未分配或改派。预外呼仍必须传准确taskId并沿任务坐席组，工号不覆盖组分配。 所有新接口来源的业务跟进初始为“未同步”，与是否已分配、是否拨打/接通分开。无工号不认定未联系；有有效工号表示已分配云呼叫坐席，不凭分配就认定业务待联系。平台本人保存的明确处理结果或经过准确关联的外部业务处理结果方可更新跟进；仅AliCti话单、挂断、接通和时长不能推断业务已完成。平台明确继续跟进/需要再次联系保留当前有权坐席待办；结束性处理结果已保存可标跟进已完成，但独立“完成沟通回调”仍只由精确结果已完成沟通触发。

#### DFIELD-112 分配处理状态

**标识**：DFIELD-112

**名称**：分配处理状态

**entity**：ManualAssignment

**存储语义键**：assignmentState

**类型**：string

**格式**：未分配云呼叫坐席/已分配坐席/已分配预外呼任务，与通话及业务跟进分轴；处理中/失败/未知不得伪报分配成功，正式wire枚举仍待。

**允许为空**：True

**必填条件**：人工接口保存分配处理中及完成反馈

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 候选待处理/处理中/已分配/失败/待确认；正式枚举待S4。未完成和UNKNOWN不能当成功或重复派发，失败不误绑他人。

2. 空字符串不是有效标识或URL；缺失/null与明确零值、false、空集合不同；不跨租户猜配。

**权限**

**read**

1. 授权当前租户业务用户/坐席及服务端

**write**

1. 有权操作者在所述阶段；服务端逐次校验

**生命周期**

#### 1

**state**：接收/编辑

**行为**：候选待处理/处理中/已分配/失败/待确认；正式枚举待S4。未完成和UNKNOWN不能当成功或重复派发，失败不误绑他人。

#### 2

**state**：保存成功

**行为**：每次同一分配的可信状态变化保存；幂等恢复沿原对象。

#### 3

**state**：校验/保存失败

**行为**：保持原已保存值，保留当次输入或证据；不生成成功副作用。

**派生规则**

**kind**：system

**rule**：候选待处理/处理中/已分配/失败/待确认；正式枚举待S4。未完成和UNKNOWN不能当成功或重复派发，失败不误绑他人。

**dependencies**

1. DFIELD-111

2. DFIELD-122

**保存**

**kind**：stored

**保存时机**：每次同一分配的可信状态变化保存；幂等恢复沿原对象。

**来源**：memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-083, memory/project-facts.json, 需求/1.1.0/分析工作区/memory/project-facts.json#local_revision_SRC126

**来源映射**：memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-083, memory/project-facts.json, 需求/1.1.0/分析工作区/memory/project-facts.json#local_revision_SRC126

**示例**

**valid**

1. 在授权准确对象上按本字段定义保存且可回读同值。

**invalid**

1. 使用其他租户/应用对象、缺必填或伪造未知为成功：拒绝并保留原状态。

**验证引用**

1. CHECK-082

2. CHECK-083

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：产品语义与保存时点已写明；字段名、物理API/存储映射及工程验证待后续设计，未宣称真实契约可用。

**current_revision_note**：人工外呼agentWorkNo选填；缺省接收且不分配云呼叫坐席、不进入个人待联系；显式提供时精确校验当前租户唯一有效坐席，错误拒绝该行，不回退成未分配或改派。预外呼仍必须传准确taskId并沿任务坐席组，工号不覆盖组分配。 所有新接口来源的业务跟进初始为“未同步”，与是否已分配、是否拨打/接通分开。无工号不认定未联系；有有效工号表示已分配云呼叫坐席，不凭分配就认定业务待联系。平台本人保存的明确处理结果或经过准确关联的外部业务处理结果方可更新跟进；仅AliCti话单、挂断、接通和时长不能推断业务已完成。平台明确继续跟进/需要再次联系保留当前有权坐席待办；结束性处理结果已保存可标跟进已完成，但独立“完成沟通回调”仍只由精确结果已完成沟通触发。

#### DFIELD-113 跟进表单草稿

**标识**：DFIELD-113

**名称**：跟进表单草稿

**entity**：CustomerFollowup

**存储语义键**：draft

**类型**：object

**格式**：人工拨号dialing/ringing与预外呼坐席offered/answering可填原表单；不扩大呼入。接通/结束保留草稿，通话未结束不得正式保存。当前原型局部暂存/重载恢复已核验；生产暂存介质、过期与事务恢复继续待工程。

**允许为空**：True

**必填条件**：准确关联人工或预外呼通话后可编辑

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 人工拨号dialing/ringing与预外呼坐席offered/answering可填原表单；不扩大呼入。接通/结束保留草稿，通话未结束不得正式保存。当前原型局部暂存/重载恢复已核验；生产暂存介质、过期与事务恢复继续待工程。

2. 缺失不能替代已确认数据；版本和真实零值按本字段含义保留，不用未知冒成功。

**权限**

**read**

1. 授权当前租户业务用户/坐席及服务端

**write**

1. 有权操作者在所述阶段；服务端逐次校验

**生命周期**

#### 1

**state**：接收/编辑

**行为**：人工拨号dialing/ringing与预外呼坐席offered/answering可填原表单；不扩大呼入。接通/结束保留草稿，通话未结束不得正式保存。当前原型局部暂存/重载恢复已核验；生产暂存介质、过期与事务恢复继续待工程。

#### 2

**state**：保存成功

**行为**：编辑时暂存到准确坐席/客户/call作用域，切换不串写；保存失败保草稿，成功再清本次草稿。

#### 3

**state**：校验/保存失败

**行为**：保持原已保存值，保留当次输入或证据；不生成成功副作用。

**派生规则**

**kind**：input

**rule**：人工拨号dialing/ringing与预外呼坐席offered/answering可填原表单；不扩大呼入。接通/结束保留草稿，通话未结束不得正式保存。当前原型局部暂存/重载恢复已核验；生产暂存介质、过期与事务恢复继续待工程。

**dependencies**



**保存**

**kind**：stored

**保存时机**：编辑时暂存到准确坐席/客户/call作用域，切换不串写；保存失败保草稿，成功再清本次草稿。

**来源**：memory/normalized-user-stories.json#AC-087, memory/normalized-user-stories.json#AC-088, memory/normalized-user-stories.json#AC-090, memory/normalized-user-stories.json#AC-091, memory/project-facts.json

**来源映射**：memory/normalized-user-stories.json#AC-087, memory/normalized-user-stories.json#AC-088, memory/normalized-user-stories.json#AC-090, memory/normalized-user-stories.json#AC-091, memory/project-facts.json

**示例**

**valid**

1. 在授权准确对象上按本字段定义保存且可回读同值。

**invalid**

1. 使用其他租户/应用对象、缺必填或伪造未知为成功：拒绝并保留原状态。

**验证引用**

1. CHECK-087

2. CHECK-088

3. CHECK-090

4. CHECK-091

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：产品语义与保存时点已写明；字段名、物理API/存储映射及工程验证待后续设计，未宣称真实契约可用。

#### DFIELD-114 人工通话状态

**标识**：DFIELD-114

**名称**：人工通话状态

**entity**：CustomerFollowup

**存储语义键**：manualCallStatus

**类型**：object

**格式**：坐席明确选择的API-327号码状态值对象，保存code与description；完整20项描述/16码（712=拒接），715/183同码多描述分别保留。不是供应商回执，不反写客观线路结果、时长、接通统计或秒挂。

**允许为空**：True

**必填条件**：明确本次外呼客户未接通且通话已结束、正式保存跟进时必选；草稿允许空。已接/客观未知或预测客户已接坐席未接不套用，呼入不扩。

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：无默认选项；空白不等183未知。客观未知不自动代选，坐席明确选择183与描述未知才形成合法人工值。

**校验规则**

1. 坐席明确选择的API-327号码状态值对象，保存code与description；完整20项描述/16码（712=拒接），715/183同码多描述分别保留。不是供应商回执，不反写客观线路结果、时长、接通统计或秒挂。

2. 必须匹配字典中的完整code+description组合；空白、未知编码、错误描述或仅同码不含准确描述均拒绝；183未知明确选择有效。

3. 必填条件按AC-088；人工录入不得改供应商status/SIP/CDR、客户或坐席接通、时长/统计、秒挂分类；业务处理结果另存DFIELD-115。

4. 业务其他条件必填依AC-091留待S3/S6；未选或校验/保存失败保草稿和原名单。

**权限**

**read**

1. 授权当前租户业务用户/坐席及服务端

**write**

1. 有权操作者在所述阶段；服务端逐次校验

**生命周期**

#### 1

**state**：接收/编辑

**行为**：从有效选项录入独立人工草稿并保留准确编码与描述；收起、阶段切换和恢复不串通话，结束且明确客户未接时正式保存要求非空。

#### 2

**state**：保存成功

**行为**：正式跟进保存成功时同时保存编码/描述及录入人DFIELD-116、时间DFIELD-117、版本DFIELD-118；迟到客观话单不覆盖。

#### 3

**state**：校验/保存失败

**行为**：保持原已保存值，保留当次输入或证据；不生成成功副作用。

**派生规则**

**kind**：input

**rule**：由当前有权坐席从完整API-327字典主动选择编码与描述；不从供应商状态、客户未知或坐席未接自动推值。

**dependencies**



**保存**

**kind**：stored

**保存时机**：正式跟进保存成功时同时保存编码/描述及录入人DFIELD-116、时间DFIELD-117、版本DFIELD-118；迟到客观话单不覆盖。

**来源**：memory/normalized-user-stories.json#AC-088, memory/normalized-user-stories.json#AC-090, memory/normalized-user-stories.json#AC-091, memory/project-facts.json, inputs/source-index.json#SRC-122

**来源映射**：memory/normalized-user-stories.json#AC-088, memory/normalized-user-stories.json#AC-090, memory/normalized-user-stories.json#AC-091, memory/project-facts.json, inputs/source-index.json#SRC-122

**示例**

**valid**

#### 1

**code**：712

**说明**：拒接

#### 2

**code**：715

**说明**：秘书台

#### 3

**code**：183

**说明**：未知

**invalid**

1. 空白未选择

#### 2

**code**：715

#### 3

**code**：183

**说明**：拒接

**验证引用**

1. CHECK-088

2. CHECK-090

3. CHECK-091

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：保留产品逻辑字段ID及候选manualCallStatus；当前原型实存agentCallStatus的code/description/recordedBy/recordedAt仅为本地证据，不因此冻结对外API或数据库字段。正式映射待设计。

**value_components**

#### 1

**存储语义键**：code

**类型**：string

**允许为空**：False

**格式**：字典代码字符串；与description成对，代码本身不能区分715/183各3项。

#### 2

**存储语义键**：description

**类型**：string

**允许为空**：False

**格式**：所选字典原描述，不以同码的首项替代。

**enum_values**

#### 1

**code**：710

**说明**：占线

#### 2

**code**：711

**说明**：暂时无人接听

#### 3

**code**：712

**说明**：拒接

#### 4

**code**：713

**说明**：空号

#### 5

**code**：714

**说明**：关机

#### 6

**code**：715

**说明**：用户线故障

#### 7

**code**：715

**说明**：暂时无法接通

#### 8

**code**：715

**说明**：秘书台

#### 9

**code**：716

**说明**：停机

#### 10

**code**：717

**说明**：呼叫受限

#### 11

**code**：718

**说明**：无人接听

#### 12

**code**：719

**说明**：正在通话中

#### 13

**code**：720

**说明**：暂停服务

#### 14

**code**：721

**说明**：来电提醒

#### 15

**code**：722

**说明**：不再使用

#### 16

**code**：723

**说明**：来电助手

#### 17

**code**：724

**说明**：号码格式不正确

#### 18

**code**：183

**说明**：嘟嘟

#### 19

**code**：183

**说明**：静音

#### 20

**code**：183

**说明**：未知

**local_evidence**

**path**：prototype/memory/verification-evidence/workbench-manual-status-20261014.json

**状态**：pass_scoped_synthetic_only

**backend_contract_verified**：False

#### DFIELD-115 跟进处理结果

**标识**：DFIELD-115

**名称**：跟进处理结果

**entity**：CustomerFollowup

**存储语义键**：disposition

**类型**：string

**格式**：包含继续跟进，其他既有结果沿原配置且完整枚举待核；提案兼容历史需要再次联系值。未接通不默认继续跟进；仅选中并保存成功才保待联系。

**允许为空**：True

**必填条件**：正式跟进保存必选；草稿允许缺失

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 包含继续跟进，其他既有结果沿原配置且完整枚举待核；提案兼容历史需要再次联系值。未接通不默认继续跟进；仅选中并保存成功才保待联系。

2. 空字符串不是有效标识或URL；缺失/null与明确零值、false、空集合不同；不跨租户猜配。

**权限**

**read**

1. 授权当前租户业务用户/坐席及服务端

**write**

1. 有权操作者在所述阶段；服务端逐次校验

**生命周期**

#### 1

**state**：接收/编辑

**行为**：包含继续跟进，其他既有结果沿原配置且完整枚举待核；提案兼容历史需要再次联系值。未接通不默认继续跟进；仅选中并保存成功才保待联系。

#### 2

**state**：保存成功

**行为**：跟进保存成功时保存；失败不改变名单；不由后到话单覆写。

#### 3

**state**：校验/保存失败

**行为**：保持原已保存值，保留当次输入或证据；不生成成功副作用。

**派生规则**

**kind**：input

**rule**：包含继续跟进，其他既有结果沿原配置且完整枚举待核；提案兼容历史需要再次联系值。未接通不默认继续跟进；仅选中并保存成功才保待联系。

**dependencies**



**保存**

**kind**：stored

**保存时机**：跟进保存成功时保存；失败不改变名单；不由后到话单覆写。

**来源**：memory/normalized-user-stories.json#AC-089, memory/normalized-user-stories.json#AC-090, memory/normalized-user-stories.json#AC-091, memory/project-facts.json

**来源映射**：memory/normalized-user-stories.json#AC-089, memory/normalized-user-stories.json#AC-090, memory/normalized-user-stories.json#AC-091, memory/project-facts.json

**示例**

**valid**

1. 在授权准确对象上按本字段定义保存且可回读同值。

**invalid**

1. 使用其他租户/应用对象、缺必填或伪造未知为成功：拒绝并保留原状态。

**验证引用**

1. CHECK-089

2. CHECK-090

3. CHECK-091

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：产品语义与保存时点已写明；字段名、物理API/存储映射及工程验证待后续设计，未宣称真实契约可用。

#### DFIELD-116 跟进录入人

**标识**：DFIELD-116

**名称**：跟进录入人

**entity**：CustomerFollowup

**存储语义键**：savedBy

**类型**：string

**格式**：取当前真实坐席身份并核tenant/customer/call归属，不由表单任意覆盖或代填其他坐席。

**允许为空**：True

**必填条件**：正式跟进保存成功时

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 取当前真实坐席身份并核tenant/customer/call归属，不由表单任意覆盖或代填其他坐席。

2. 空字符串不是有效标识或URL；缺失/null与明确零值、false、空集合不同；不跨租户猜配。

**权限**

**read**

1. 授权当前租户业务用户/坐席及服务端

**write**

1. 有权操作者在所述阶段；服务端逐次校验

**生命周期**

#### 1

**state**：接收/编辑

**行为**：取当前真实坐席身份并核tenant/customer/call归属，不由表单任意覆盖或代填其他坐席。

#### 2

**state**：保存成功

**行为**：和成功跟进记录一起保存，失败不提前写已保存。

#### 3

**state**：校验/保存失败

**行为**：保持原已保存值，保留当次输入或证据；不生成成功副作用。

**派生规则**

**kind**：system

**rule**：取当前真实坐席身份并核tenant/customer/call归属，不由表单任意覆盖或代填其他坐席。

**dependencies**

1. DFIELD-111

**保存**

**kind**：stored

**保存时机**：和成功跟进记录一起保存，失败不提前写已保存。

**来源**：memory/normalized-user-stories.json#AC-088, memory/normalized-user-stories.json#AC-090, memory/project-facts.json

**来源映射**：memory/normalized-user-stories.json#AC-088, memory/normalized-user-stories.json#AC-090, memory/project-facts.json

**示例**

**valid**

1. 在授权准确对象上按本字段定义保存且可回读同值。

**invalid**

1. 使用其他租户/应用对象、缺必填或伪造未知为成功：拒绝并保留原状态。

**验证引用**

1. CHECK-088

2. CHECK-090

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：产品语义与保存时点已写明；字段名、物理API/存储映射及工程验证待后续设计，未宣称真实契约可用。

#### DFIELD-117 跟进保存时间

**标识**：DFIELD-117

**名称**：跟进保存时间

**entity**：CustomerFollowup

**存储语义键**：savedAt

**类型**：string

**格式**：系统保存时间，时区/格式为工程方案待核；与实际呼叫时间、草稿编辑时间区分。

**允许为空**：True

**必填条件**：正式跟进保存成功时

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 系统保存时间，时区/格式为工程方案待核；与实际呼叫时间、草稿编辑时间区分。

2. 空字符串不是有效标识或URL；缺失/null与明确零值、false、空集合不同；不跨租户猜配。

**权限**

**read**

1. 授权当前租户业务用户/坐席及服务端

**write**

1. 有权操作者在所述阶段；服务端逐次校验

**生命周期**

#### 1

**state**：接收/编辑

**行为**：系统保存时间，时区/格式为工程方案待核；与实际呼叫时间、草稿编辑时间区分。

#### 2

**state**：保存成功

**行为**：跟进保存成功同时写入；重复保存返原记录，不伪造新保存。

#### 3

**state**：校验/保存失败

**行为**：保持原已保存值，保留当次输入或证据；不生成成功副作用。

**派生规则**

**kind**：system

**rule**：系统保存时间，时区/格式为工程方案待核；与实际呼叫时间、草稿编辑时间区分。

**dependencies**



**保存**

**kind**：stored

**保存时机**：跟进保存成功同时写入；重复保存返原记录，不伪造新保存。

**来源**：memory/normalized-user-stories.json#AC-088, memory/normalized-user-stories.json#AC-090, memory/project-facts.json

**来源映射**：memory/normalized-user-stories.json#AC-088, memory/normalized-user-stories.json#AC-090, memory/project-facts.json

**示例**

**valid**

1. 在授权准确对象上按本字段定义保存且可回读同值。

**invalid**

1. 使用其他租户/应用对象、缺必填或伪造未知为成功：拒绝并保留原状态。

**验证引用**

1. CHECK-088

2. CHECK-090

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：产品语义与保存时点已写明；字段名、物理API/存储映射及工程验证待后续设计，未宣称真实契约可用。

#### DFIELD-118 跟进记录版本

**标识**：DFIELD-118

**名称**：跟进记录版本

**entity**：CustomerFollowup

**存储语义键**：version

**类型**：string

**格式**：稳定版本表示待工程；提交预期版本与当前记录一致才可更新，旧版本冲突保草稿/原名单。

**允许为空**：True

**必填条件**：更新已有跟进及并发检查时

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 稳定版本表示待工程；提交预期版本与当前记录一致才可更新，旧版本冲突保草稿/原名单。

2. 空字符串不是有效标识或URL；缺失/null与明确零值、false、空集合不同；不跨租户猜配。

**权限**

**read**

1. 授权当前租户业务用户/坐席及服务端

**write**

1. 有权操作者在所述阶段；服务端逐次校验

**生命周期**

#### 1

**state**：接收/编辑

**行为**：稳定版本表示待工程；提交预期版本与当前记录一致才可更新，旧版本冲突保草稿/原名单。

#### 2

**state**：保存成功

**行为**：正式保存成功创建或更新版本，重复同操作复用原结果。

#### 3

**state**：校验/保存失败

**行为**：保持原已保存值，保留当次输入或证据；不生成成功副作用。

**派生规则**

**kind**：system

**rule**：稳定版本表示待工程；提交预期版本与当前记录一致才可更新，旧版本冲突保草稿/原名单。

**dependencies**



**保存**

**kind**：stored

**保存时机**：正式保存成功创建或更新版本，重复同操作复用原结果。

**来源**：memory/normalized-user-stories.json#AC-090, memory/project-facts.json

**来源映射**：memory/normalized-user-stories.json#AC-090, memory/project-facts.json

**示例**

**valid**

1. 在授权准确对象上按本字段定义保存且可回读同值。

**invalid**

1. 使用其他租户/应用对象、缺必填或伪造未知为成功：拒绝并保留原状态。

**验证引用**

1. CHECK-090

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：产品语义与保存时点已写明；字段名、物理API/存储映射及工程验证待后续设计，未宣称真实契约可用。

#### DFIELD-119 客户待联系状态

**标识**：DFIELD-119

**名称**：客户待联系状态

**entity**：Customer

**存储语义键**：pendingContactState

**类型**：string

**格式**：候选待联系/处理中/已完成等沿现有列表；仅继续跟进保存成功保待联系。人工保原分配，预测当前坐席后续人工；不同于call完成或供应商任务状态。

**允许为空**：True

**必填条件**：人工分配或跟进保存造成名单变化时

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 候选待联系/处理中/已完成等沿现有列表；仅继续跟进保存成功保待联系。人工保原分配，预测当前坐席后续人工；不同于call完成或供应商任务状态。

2. 空字符串不是有效标识或URL；缺失/null与明确零值、false、空集合不同；不跨租户猜配。

**权限**

**read**

1. 授权当前租户业务用户/坐席及服务端

**write**

1. 有权操作者在所述阶段；服务端逐次校验

**生命周期**

#### 1

**state**：接收/编辑

**行为**：候选待联系/处理中/已完成等沿现有列表；仅继续跟进保存成功保待联系。人工保原分配，预测当前坐席后续人工；不同于call完成或供应商任务状态。

#### 2

**state**：保存成功

**行为**：新接口客户业务跟进初始未同步，不能由导入或分配推为待联系；平台本人显式确认联系安排或保存明确跟进结果时可更新平台安排，DCC业务状态另存。跟进与名单更新成功后更新，失败保原名单。

#### 3

**state**：校验/保存失败

**行为**：保持原已保存值，保留当次输入或证据；不生成成功副作用。

**派生规则**

**kind**：system

**rule**：候选待联系/处理中/已完成等沿现有列表；仅继续跟进保存成功保待联系。人工保原分配，预测当前坐席后续人工；不同于call完成或供应商任务状态。

**dependencies**

1. DFIELD-112

2. DFIELD-115

**保存**

**kind**：stored

**保存时机**：新接口客户业务跟进初始未同步，不能由导入或分配推为待联系；平台本人显式确认联系安排或保存明确跟进结果时可更新平台安排，DCC业务状态另存。跟进与名单更新成功后更新，失败保原名单。

**来源**：memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-089, memory/normalized-user-stories.json#AC-090, memory/project-facts.json

**来源映射**：memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-089, memory/normalized-user-stories.json#AC-090, memory/project-facts.json

**示例**

**valid**

1. 在授权准确对象上按本字段定义保存且可回读同值。

**invalid**

1. 使用其他租户/应用对象、缺必填或伪造未知为成功：拒绝并保留原状态。

**验证引用**

1. CHECK-082

2. CHECK-089

3. CHECK-090

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：产品语义与保存时点已写明；字段名、物理API/存储映射及工程验证待后续设计，未宣称真实契约可用。

#### DFIELD-120 原预测任务执行排他状态

**标识**：DFIELD-120

**名称**：原预测任务执行排他状态

**entity**：CustomerFollowup

**存储语义键**：predictiveExecutionGuard

**类型**：string

**格式**：候选待确认/已核独占/冲突；需供应商与工程证据确认原任务自动呼叫不并发，不因继续跟进或finishRetryFlag推定原任务停止；未知不能宣称安全再次拨号。

**允许为空**：True

**必填条件**：预测转当前坐席后续人工拨打前

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 候选待确认/已核独占/冲突；需供应商与工程证据确认原任务自动呼叫不并发，不因继续跟进或finishRetryFlag推定原任务停止；未知不能宣称安全再次拨号。

2. 空字符串不是有效标识或URL；缺失/null与明确零值、false、空集合不同；不跨租户猜配。

**权限**

**read**

1. 授权当前租户业务用户/坐席及服务端

**write**

1. 有权操作者在所述阶段；服务端逐次校验

**生命周期**

#### 1

**state**：接收/编辑

**行为**：候选待确认/已核独占/冲突；需供应商与工程证据确认原任务自动呼叫不并发，不因继续跟进或finishRetryFlag推定原任务停止；未知不能宣称安全再次拨号。

#### 2

**state**：保存成功

**行为**：保存继续跟进意图时记录待确认；只有可信精确证据到达才更新守卫，不能伪造远端停止。

#### 3

**state**：校验/保存失败

**行为**：保持原已保存值，保留当次输入或证据；不生成成功副作用。

**派生规则**

**kind**：system

**rule**：候选待确认/已核独占/冲突；需供应商与工程证据确认原任务自动呼叫不并发，不因继续跟进或finishRetryFlag推定原任务停止；未知不能宣称安全再次拨号。

**dependencies**

1. DFIELD-123

**保存**

**kind**：stored

**保存时机**：保存继续跟进意图时记录待确认；只有可信精确证据到达才更新守卫，不能伪造远端停止。

**来源**：memory/normalized-user-stories.json#AC-089, memory/normalized-user-stories.json#AC-090, memory/project-facts.json

**来源映射**：memory/normalized-user-stories.json#AC-089, memory/normalized-user-stories.json#AC-090, memory/project-facts.json

**示例**

**valid**

1. 在授权准确对象上按本字段定义保存且可回读同值。

**invalid**

1. 使用其他租户/应用对象、缺必填或伪造未知为成功：拒绝并保留原状态。

**验证引用**

1. CHECK-089

2. CHECK-090

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：产品语义与保存时点已写明；字段名、物理API/存储映射及工程验证待后续设计，未宣称真实契约可用。

#### DFIELD-121 应用登记业务来源

**标识**：DFIELD-121

**名称**：应用登记业务来源

**entity**：Application

**存储语义键**：registeredSource

**类型**：string

**格式**：稳定应用对应业务系统登记，DCC/天网各自应用；不按显示名或报文source自行换系统。配置来源UI与字段枚举待核，不新增无必要菜单。

**允许为空**：True

**必填条件**：应用接口来源识别前须准确登记；具体配置字段待S3/S4

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 稳定应用对应业务系统登记，DCC/天网各自应用；不按显示名或报文source自行换系统。配置来源UI与字段枚举待核，不新增无必要菜单。

2. 空字符串不是有效标识或URL；缺失/null与明确零值、false、空集合不同；不跨租户猜配。

**权限**

**read**

1. 超管及身份/接收服务

**write**

1. 受控登记流程；具体权限待核

**生命周期**

#### 1

**state**：接收/编辑

**行为**：稳定应用对应业务系统登记，DCC/天网各自应用；不按显示名或报文source自行换系统。配置来源UI与字段枚举待核，不新增无必要菜单。

#### 2

**state**：保存成功

**行为**：受控登记成功时保存；接收记录复制准确原来源，应用改名/删除不迁历史。

#### 3

**state**：校验/保存失败

**行为**：保持原已保存值，保留当次输入或证据；不生成成功副作用。

**派生规则**

**kind**：input

**rule**：稳定应用对应业务系统登记，DCC/天网各自应用；不按显示名或报文source自行换系统。配置来源UI与字段枚举待核，不新增无必要菜单。

**dependencies**



**保存**

**kind**：stored

**保存时机**：受控登记成功时保存；接收记录复制准确原来源，应用改名/删除不迁历史。

**来源**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-080, memory/normalized-user-stories.json#AC-085, memory/project-facts.json

**来源映射**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-080, memory/normalized-user-stories.json#AC-085, memory/project-facts.json

**示例**

**valid**

1. 在授权准确对象上按本字段定义保存且可回读同值。

**invalid**

1. 使用其他租户/应用对象、缺必填或伪造未知为成功：拒绝并保留原状态。

**验证引用**

1. CHECK-017

2. CHECK-047

3. CHECK-075

4. CHECK-080

5. CHECK-085

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：产品语义与保存时点已写明；字段名、物理API/存储映射及工程验证待后续设计，未宣称真实契约可用。

#### DFIELD-122 人工分配标识

**标识**：DFIELD-122

**名称**：人工分配标识

**entity**：ManualAssignment

**存储语义键**：assignmentId

**类型**：string

**格式**：本方候选稳定标识，格式待工程；关联真实客户/原请求行/tenant/app/坐席；不等于预测taskId/fileId或业务root。

**允许为空**：True

**必填条件**：真实人工分配建立后

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 本方候选稳定标识，格式待工程；关联真实客户/原请求行/tenant/app/坐席；不等于预测taskId/fileId或业务root。

2. 空字符串不是有效标识或URL；缺失/null与明确零值、false、空集合不同；不跨租户猜配。

**权限**

**read**

1. 授权当前租户业务用户/坐席及服务端

**write**

1. 有权操作者在所述阶段；服务端逐次校验

**生命周期**

#### 1

**state**：接收/编辑

**行为**：本方候选稳定标识，格式待工程；关联真实客户/原请求行/tenant/app/坐席；不等于预测taskId/fileId或业务root。

#### 2

**state**：保存成功

**行为**：同一有效行保存分配时建立；技术重传/未知恢复复用原对象，不重建。

#### 3

**state**：校验/保存失败

**行为**：保持原已保存值，保留当次输入或证据；不生成成功副作用。

**派生规则**

**kind**：system

**rule**：本方候选稳定标识，格式待工程；关联真实客户/原请求行/tenant/app/坐席；不等于预测taskId/fileId或业务root。

**dependencies**

1. DFIELD-019

2. DFIELD-022

3. DFIELD-037

4. DFIELD-111

**保存**

**kind**：stored

**保存时机**：同一有效行保存分配时建立；技术重传/未知恢复复用原对象，不重建。

**来源**：memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-083, memory/project-facts.json

**来源映射**：memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-083, memory/project-facts.json

**示例**

**valid**

1. 在授权准确对象上按本字段定义保存且可回读同值。

**invalid**

1. 使用其他租户/应用对象、缺必填或伪造未知为成功：拒绝并保留原状态。

**验证引用**

1. CHECK-082

2. CHECK-083

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：产品语义与保存时点已写明；字段名、物理API/存储映射及工程验证待后续设计，未宣称真实契约可用。

#### DFIELD-123 原预测呼叫溯源

**标识**：DFIELD-123

**名称**：原预测呼叫溯源

**entity**：CustomerFollowup

**存储语义键**：originalPredictiveTrace

**类型**：object

**格式**：保留原tenant/app/task/record/call以及实际关联；只是来源证据，不把后续人工拨打伪装为原预测呼叫，不重造线索。人工原导入可无预测信息。

**允许为空**：True

**必填条件**：预外呼继续跟进转人工时

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 保留原tenant/app/task/record/call以及实际关联；只是来源证据，不把后续人工拨打伪装为原预测呼叫，不重造线索。人工原导入可无预测信息。

2. 缺失不能替代已确认数据；版本和真实零值按本字段含义保留，不用未知冒成功。

**权限**

**read**

1. 授权当前租户业务用户/坐席及服务端

**write**

1. 有权操作者在所述阶段；服务端逐次校验

**生命周期**

#### 1

**state**：接收/编辑

**行为**：保留原tenant/app/task/record/call以及实际关联；只是来源证据，不把后续人工拨打伪装为原预测呼叫，不重造线索。人工原导入可无预测信息。

#### 2

**state**：保存成功

**行为**：跟进保存转人工时沿已核原关系保存，只读溯源；未知不猜配。

#### 3

**state**：校验/保存失败

**行为**：保持原已保存值，保留当次输入或证据；不生成成功副作用。

**派生规则**

**kind**：system

**rule**：保留原tenant/app/task/record/call以及实际关联；只是来源证据，不把后续人工拨打伪装为原预测呼叫，不重造线索。人工原导入可无预测信息。

**dependencies**

1. DFIELD-010

2. DFIELD-015

3. DFIELD-037

4. DFIELD-041

5. DFIELD-075

**保存**

**kind**：stored

**保存时机**：跟进保存转人工时沿已核原关系保存，只读溯源；未知不猜配。

**来源**：memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-089, memory/normalized-user-stories.json#AC-090, memory/project-facts.json

**来源映射**：memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-089, memory/normalized-user-stories.json#AC-090, memory/project-facts.json

**示例**

**valid**

1. 在授权准确对象上按本字段定义保存且可回读同值。

**invalid**

1. 使用其他租户/应用对象、缺必填或伪造未知为成功：拒绝并保留原状态。

**验证引用**

1. CHECK-023

2. CHECK-089

3. CHECK-090

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：产品语义与保存时点已写明；字段名、物理API/存储映射及工程验证待后续设计，未宣称真实契约可用。

#### DFIELD-124 业务批次号

**标识**：DFIELD-124

**名称**：业务批次号

**entity**：ExternalImportRecord

**存储语义键**：businessBatchNo

**类型**：string (proposed)

**格式**：请求级拟定businessBatchNo，同一app/tenant可用于多次新业务导入，逐行保存导入时原值并随每次回调返回。仅分组追踪，不作幂等唯一键；跨app/tenant不合并。

**允许为空**：True

**必填条件**：新接口导入请求必填；原手工UI或历史无值记录可缺失

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 请求级拟定businessBatchNo，同一app/tenant可用于多次新业务导入，逐行保存导入时原值并随每次回调返回。仅分组追踪，不作幂等唯一键；跨app/tenant不合并。

2. 正式报文名称、长度、编码、空白/大小写与兼容策略仍待接口评审；不得把本讨论稿提案当已联调协议。

**权限**

**read**

1. 当前授权对象的业务用户/服务端及原业务系统回调接收方

**write**

1. DFIELD-124由原接口调用方提交，服务端校验后绑定新记录

**生命周期**

#### 1

**state**：新业务导入

**行为**：首次接收有效新行时与原app/tenant/request行一并保存；技术重传复用原值；历史缺值不伪造。

#### 2

**state**：重传/补送

**行为**：保持原记录值与既定版本快照，不查询最新同批次或同号码替代。

#### 3

**state**：历史缺失/身份未知

**行为**：保留未知与待核，不从平台批次、fileId或其他记录补造。

**派生规则**

**kind**：external_input

**rule**：请求级拟定businessBatchNo，同一app/tenant可用于多次新业务导入，逐行保存导入时原值并随每次回调返回。仅分组追踪，不作幂等唯一键；跨app/tenant不合并。

**dependencies**

1. DFIELD-010

2. DFIELD-037

3. DFIELD-041

**保存**

**kind**：stored

**保存时机**：首次接收有效新行时与原app/tenant/request行一并保存；技术重传复用原值；历史缺值不伪造。

**来源**：memory/normalized-user-stories.json#AC-093, memory/normalized-user-stories.json#AC-094, memory/normalized-user-stories.json#AC-096, inputs/source-index.json#SRC-123

**来源映射**：memory/normalized-user-stories.json#AC-093, memory/normalized-user-stories.json#AC-094, memory/normalized-user-stories.json#AC-096, inputs/source-index.json#SRC-123

**示例**

**valid**

1. 同一app/tenant两次新请求共用BIZ-20261014-A，各保存该原值并随记录回传。

**invalid**

1. 用复用业务批次合并不同应用记录、冒充requestId、重置平台批次/失败次数。

**验证引用**

1. CHECK-093

2. CHECK-094

3. CHECK-096

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：用户确认业务语义；具体字段名、物理模型、payload/事件版本/事务和正式接收ACK仍是待评审工程提案。

#### DFIELD-125 完成沟通回调快照

**标识**：DFIELD-125

**名称**：完成沟通回调快照

**entity**：CompletedCommunicationEvent

**存储语义键**：completionSnapshot

**类型**：object (proposed)

**格式**：不可变版本快照拟含原app/tenant/record、businessBatchNo、callId、本次客观通话记录（已知状态、起止/时长、录音等，缺失显式未知）、独立人工状态、本次已保存customerFollowup业务类型/字段值及录入人/时间/保存版本。字段/选项业务编码必须携带；具体wire字段名、schema和配置版本标识待正式契约。 本次已填写选填业务字段必须回传配置的字段业务编码；有选项字段同时回传选中选项业务编码及对应值，多选包含全部选中编码。编码与值来自本次保存时原租户业务配置快照，后续改配置不改变原补送内容；不能仅发中文label或内部id。未填写字段不伪造取值；已填写字段或选项缺业务码标回调资料待完善/待核，不冒充完整发送成功，也不擅自阻断本地保存或丢失草稿。 SRC124本次原导入意向门店/车系编码与名称、Smartcode也一并冻结在快照，字段缺失如实表达，不读当前客户跨通话聚合。 另携同次来源留资时间leadCreatedAt，不以importedAt/savedAt代替。

**允许为空**：True

**必填条件**：准确接口来源外呼通话结束、处理结果恰为已完成沟通且本次跟进可靠保存成功后

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 不可变版本快照拟含原app/tenant/record、businessBatchNo、callId、本次客观通话记录（已知状态、起止/时长、录音等，缺失显式未知）、独立人工状态、本次已保存customerFollowup业务类型/字段值及录入人/时间/保存版本。字段标识/业务键/展示标签和配置版本如何携带仍待正式契约。

2. 只用准确本call客观事实和本次保存业务值；不读取客户最新跨通话聚合，不以人工状态替代线路结果。

3. 本次已填写选填业务字段必须回传配置的字段业务编码；有选项字段同时回传选中选项业务编码及对应值，多选包含全部选中编码。编码与值来自本次保存时原租户业务配置快照，后续改配置不改变原补送内容；不能仅发中文label或内部id。未填写字段不伪造取值；已填写字段或选项缺业务码标回调资料待完善/待核，不冒充完整发送成功，也不擅自阻断本地保存或丢失草稿。

4. 六个固定来源字段和本次已填业务字段/选项编码各保语义；不互相替代，不用计划到店门店冒充意向门店。

**权限**

**read**

1. 当前授权对象的业务用户/服务端及原业务系统回调接收方

**write**

1. 服务端在本次跟进可靠保存成功时固化；坐席不能自行改事件身份/路由

**生命周期**

#### 1

**state**：完成沟通保存成功

**行为**：跟进保存与事件创建须可靠一致；相同call/保存版本重复请求复用原事件。补送用原快照，晚到话单采用新补全版本还是等待的策略待审，不静默覆写原事件。

#### 2

**state**：重传/补送

**行为**：保持原记录值与既定版本快照，不查询最新同批次或同号码替代。

#### 3

**state**：历史缺失/身份未知

**行为**：保留未知与待核，不从平台批次、fileId或其他记录补造。

**派生规则**

**kind**：system_snapshot

**rule**：不可变版本快照拟含原app/tenant/record、businessBatchNo、callId、本次客观通话记录（已知状态、起止/时长、录音等，缺失显式未知）、独立人工状态、本次已保存customerFollowup业务类型/字段值及录入人/时间/保存版本。字段/选项业务编码必须携带；具体wire字段名、schema和配置版本标识待正式契约。 本次已填写选填业务字段必须回传配置的字段业务编码；有选项字段同时回传选中选项业务编码及对应值，多选包含全部选中编码。编码与值来自本次保存时原租户业务配置快照，后续改配置不改变原补送内容；不能仅发中文label或内部id。未填写字段不伪造取值；已填写字段或选项缺业务码标回调资料待完善/待核，不冒充完整发送成功，也不擅自阻断本地保存或丢失草稿。 SRC124本次原导入意向门店/车系编码与名称、Smartcode也一并冻结在快照，字段缺失如实表达，不读当前客户跨通话聚合。 另携同次来源留资时间leadCreatedAt，不以importedAt/savedAt代替。

**dependencies**

1. DFIELD-010

2. DFIELD-037

3. DFIELD-041

4. DFIELD-075

5. DFIELD-076

6. DFIELD-114

7. DFIELD-115

8. DFIELD-116

9. DFIELD-117

10. DFIELD-118

11. DFIELD-124

12. DFIELD-024

13. DFIELD-126

14. DFIELD-127

15. DFIELD-128

16. DFIELD-129

17. DFIELD-130

18. DFIELD-131

**保存**

**kind**：stored

**保存时机**：跟进保存与事件创建须可靠一致；相同call/保存版本重复请求复用原事件。补送用原快照，晚到话单采用新补全版本还是等待的策略待审，不静默覆写原事件。

**来源**：memory/normalized-user-stories.json#AC-095, memory/normalized-user-stories.json#AC-096, memory/normalized-user-stories.json#AC-097, inputs/source-index.json#SRC-123, memory/normalized-user-stories.json#AC-098, memory/normalized-user-stories.json#AC-101, inputs/source-index.json#SRC-124

**来源映射**：memory/normalized-user-stories.json#AC-095, memory/normalized-user-stories.json#AC-096, memory/normalized-user-stories.json#AC-097, inputs/source-index.json#SRC-123, memory/normalized-user-stories.json#AC-098, memory/normalized-user-stories.json#AC-101, inputs/source-index.json#SRC-124

**示例**

**valid**

1. 同call已完成沟通保存版本2的通话与表单快照，补送仍为原版本2。

2. 本次选填字段field.businessKey=lead_level，所选option.businessKey=A：按当次配置返回字段编码lead_level、选项编码A及值；其他后来通话/配置不替换。

**invalid**

1. 把仅processingStatus已完成或跨通话aggregate作为本次完成沟通内容。

2. 仅以“意向等级/高”中文、内部field.id/option.id代替所需业务编码，或把缺码发成完整成功。

**验证引用**

1. CHECK-095

2. CHECK-096

3. CHECK-097

4. CHECK-098

5. CHECK-101

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：用户确认业务语义；具体字段名、物理模型、payload/事件版本/事务和正式接收ACK仍是待评审工程提案。

#### DFIELD-126 意向门店编码

**标识**：DFIELD-126

**名称**：意向门店编码

**entity**：ExternalImportRecord

**存储语义键**：intentionStoreCode

**类型**：string (proposed)

**格式**：意向门店编码来自本次原业务系统导入行或原手工选填列；保持字符串前导零、大小写，不从手机号/其他通话/计划到店门店推导。正式报文名称、长度/空白规则和业务字典仍待定。

**允许为空**：True

**必填条件**：选填；新有效行提供时保存，未提供不导致导入失败。

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 字段提供时为原文本；编码不能按数值处理，Smartcode是不透明外部文本，不猜其业务算法。

2. 不新增必填/成对必填/强制枚举；历史缺值不补造，不批量覆盖已有记录。

**权限**

**read**

1. 当前有对象权限的运营/管理员/坐席；原记录所属业务系统的完成沟通回调

**write**

1. 本次导入调用方/原手工输入，服务端保存；本轮显示原导入信息只读，未新增坐席修改导入原值操作

**生命周期**

#### 1

**state**：新导入

**行为**：逐行保存本次提供的原文本；缺值不失败。

#### 2

**state**：预览/客户及通话详情/早填单

**行为**：展示准确原导入值，未填显示未提供；选填在必填之后，不加页面/技术编码输入。

#### 3

**state**：完成沟通快照/补送

**行为**：冻结原app/tenant/record/call关联的本次六字段，补送用原快照，不读最新同号或其他来源值。

**派生规则**

**kind**：external_input

**rule**：意向门店编码来自本次原业务系统导入行或原手工选填列；保持字符串前导零、大小写，不从手机号/其他通话/计划到店门店推导。正式报文名称、长度/空白规则和业务字典仍待定。

**dependencies**

1. DFIELD-010

2. DFIELD-037

3. DFIELD-041

**保存**

**kind**：stored

**保存时机**：首次有效新行接收时保存并随客户/分配/本次通话来源快照传递；技术重传保原映射，人工方式不造预测批次。

**来源**：memory/normalized-user-stories.json#AC-099, memory/normalized-user-stories.json#AC-100, memory/normalized-user-stories.json#AC-101, inputs/source-index.json#SRC-124

**来源映射**：memory/normalized-user-stories.json#AC-099, memory/normalized-user-stories.json#AC-100, memory/normalized-user-stories.json#AC-101, inputs/source-index.json#SRC-124

**示例**

**valid**

1. 0007

**invalid**

1. 把其他租户/导入/通话的值按同手机号覆盖当前原值。

**验证引用**

1. CHECK-099

2. CHECK-100

3. CHECK-101

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：六个字段用户明确要求，选填/只读展示为本次工作假设；wire命名和生产存储映射待审，局部合成实现以新证据为准。

#### DFIELD-127 意向门店名称

**标识**：DFIELD-127

**名称**：意向门店名称

**entity**：ExternalImportRecord

**存储语义键**：intentionStoreName

**类型**：string (proposed)

**格式**：意向门店名称来自本次原业务系统导入行或原手工选填列；保持字符串前导零、大小写，不从手机号/其他通话/计划到店门店推导。正式报文名称、长度/空白规则和业务字典仍待定。

**允许为空**：True

**必填条件**：选填；新有效行提供时保存，未提供不导致导入失败。

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 字段提供时为原文本；编码不能按数值处理，Smartcode是不透明外部文本，不猜其业务算法。

2. 不新增必填/成对必填/强制枚举；历史缺值不补造，不批量覆盖已有记录。

**权限**

**read**

1. 当前有对象权限的运营/管理员/坐席；原记录所属业务系统的完成沟通回调

**write**

1. 本次导入调用方/原手工输入，服务端保存；本轮显示原导入信息只读，未新增坐席修改导入原值操作

**生命周期**

#### 1

**state**：新导入

**行为**：逐行保存本次提供的原文本；缺值不失败。

#### 2

**state**：预览/客户及通话详情/早填单

**行为**：展示准确原导入值，未填显示未提供；选填在必填之后，不加页面/技术编码输入。

#### 3

**state**：完成沟通快照/补送

**行为**：冻结原app/tenant/record/call关联的本次六字段，补送用原快照，不读最新同号或其他来源值。

**派生规则**

**kind**：external_input

**rule**：意向门店名称来自本次原业务系统导入行或原手工选填列；保持字符串前导零、大小写，不从手机号/其他通话/计划到店门店推导。正式报文名称、长度/空白规则和业务字典仍待定。

**dependencies**

1. DFIELD-010

2. DFIELD-037

3. DFIELD-041

**保存**

**kind**：stored

**保存时机**：首次有效新行接收时保存并随客户/分配/本次通话来源快照传递；技术重传保原映射，人工方式不造预测批次。

**来源**：memory/normalized-user-stories.json#AC-099, memory/normalized-user-stories.json#AC-100, memory/normalized-user-stories.json#AC-101, inputs/source-index.json#SRC-124

**来源映射**：memory/normalized-user-stories.json#AC-099, memory/normalized-user-stories.json#AC-100, memory/normalized-user-stories.json#AC-101, inputs/source-index.json#SRC-124

**示例**

**valid**

1. 本次原导入文本

**invalid**

1. 把其他租户/导入/通话的值按同手机号覆盖当前原值。

**验证引用**

1. CHECK-099

2. CHECK-100

3. CHECK-101

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：六个字段用户明确要求，选填/只读展示为本次工作假设；wire命名和生产存储映射待审，局部合成实现以新证据为准。

#### DFIELD-128 意向车系编码

**标识**：DFIELD-128

**名称**：意向车系编码

**entity**：ExternalImportRecord

**存储语义键**：intentionSeriesCode

**类型**：string (proposed)

**格式**：意向车系编码来自本次原业务系统导入行或原手工选填列；保持字符串前导零、大小写，不从手机号/其他通话/计划到店门店推导。正式报文名称、长度/空白规则和业务字典仍待定。

**允许为空**：True

**必填条件**：选填；新有效行提供时保存，未提供不导致导入失败。

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 字段提供时为原文本；编码不能按数值处理，Smartcode是不透明外部文本，不猜其业务算法。

2. 不新增必填/成对必填/强制枚举；历史缺值不补造，不批量覆盖已有记录。

**权限**

**read**

1. 当前有对象权限的运营/管理员/坐席；原记录所属业务系统的完成沟通回调

**write**

1. 本次导入调用方/原手工输入，服务端保存；本轮显示原导入信息只读，未新增坐席修改导入原值操作

**生命周期**

#### 1

**state**：新导入

**行为**：逐行保存本次提供的原文本；缺值不失败。

#### 2

**state**：预览/客户及通话详情/早填单

**行为**：展示准确原导入值，未填显示未提供；选填在必填之后，不加页面/技术编码输入。

#### 3

**state**：完成沟通快照/补送

**行为**：冻结原app/tenant/record/call关联的本次六字段，补送用原快照，不读最新同号或其他来源值。

**派生规则**

**kind**：external_input

**rule**：意向车系编码来自本次原业务系统导入行或原手工选填列；保持字符串前导零、大小写，不从手机号/其他通话/计划到店门店推导。正式报文名称、长度/空白规则和业务字典仍待定。

**dependencies**

1. DFIELD-010

2. DFIELD-037

3. DFIELD-041

**保存**

**kind**：stored

**保存时机**：首次有效新行接收时保存并随客户/分配/本次通话来源快照传递；技术重传保原映射，人工方式不造预测批次。

**来源**：memory/normalized-user-stories.json#AC-099, memory/normalized-user-stories.json#AC-100, memory/normalized-user-stories.json#AC-101, inputs/source-index.json#SRC-124

**来源映射**：memory/normalized-user-stories.json#AC-099, memory/normalized-user-stories.json#AC-100, memory/normalized-user-stories.json#AC-101, inputs/source-index.json#SRC-124

**示例**

**valid**

1. 0007

**invalid**

1. 把其他租户/导入/通话的值按同手机号覆盖当前原值。

**验证引用**

1. CHECK-099

2. CHECK-100

3. CHECK-101

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：六个字段用户明确要求，选填/只读展示为本次工作假设；wire命名和生产存储映射待审，局部合成实现以新证据为准。

#### DFIELD-129 意向车系

**标识**：DFIELD-129

**名称**：意向车系

**entity**：ExternalImportRecord

**存储语义键**：intentionSeries

**类型**：string (proposed)

**格式**：意向车系来自本次原业务系统导入行或原手工选填列；保持字符串前导零、大小写，不从手机号/其他通话/计划到店门店推导。正式报文名称、长度/空白规则和业务字典仍待定。

**允许为空**：True

**必填条件**：选填；新有效行提供时保存，未提供不导致导入失败。

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 字段提供时为原文本；编码不能按数值处理，Smartcode是不透明外部文本，不猜其业务算法。

2. 不新增必填/成对必填/强制枚举；历史缺值不补造，不批量覆盖已有记录。

**权限**

**read**

1. 当前有对象权限的运营/管理员/坐席；原记录所属业务系统的完成沟通回调

**write**

1. 本次导入调用方/原手工输入，服务端保存；本轮显示原导入信息只读，未新增坐席修改导入原值操作

**生命周期**

#### 1

**state**：新导入

**行为**：逐行保存本次提供的原文本；缺值不失败。

#### 2

**state**：预览/客户及通话详情/早填单

**行为**：展示准确原导入值，未填显示未提供；选填在必填之后，不加页面/技术编码输入。

#### 3

**state**：完成沟通快照/补送

**行为**：冻结原app/tenant/record/call关联的本次六字段，补送用原快照，不读最新同号或其他来源值。

**派生规则**

**kind**：external_input

**rule**：意向车系来自本次原业务系统导入行或原手工选填列；保持字符串前导零、大小写，不从手机号/其他通话/计划到店门店推导。正式报文名称、长度/空白规则和业务字典仍待定。

**dependencies**

1. DFIELD-010

2. DFIELD-037

3. DFIELD-041

**保存**

**kind**：stored

**保存时机**：首次有效新行接收时保存并随客户/分配/本次通话来源快照传递；技术重传保原映射，人工方式不造预测批次。

**来源**：memory/normalized-user-stories.json#AC-099, memory/normalized-user-stories.json#AC-100, memory/normalized-user-stories.json#AC-101, inputs/source-index.json#SRC-124

**来源映射**：memory/normalized-user-stories.json#AC-099, memory/normalized-user-stories.json#AC-100, memory/normalized-user-stories.json#AC-101, inputs/source-index.json#SRC-124

**示例**

**valid**

1. 本次原导入文本

**invalid**

1. 把其他租户/导入/通话的值按同手机号覆盖当前原值。

**验证引用**

1. CHECK-099

2. CHECK-100

3. CHECK-101

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：六个字段用户明确要求，选填/只读展示为本次工作假设；wire命名和生产存储映射待审，局部合成实现以新证据为准。

#### DFIELD-130 Smartcode

**标识**：DFIELD-130

**名称**：Smartcode

**entity**：ExternalImportRecord

**存储语义键**：smartCode

**类型**：string (proposed)

**格式**：Smartcode来自本次原业务系统导入行或原手工选填列；保持字符串前导零、大小写，不从手机号/其他通话/计划到店门店推导。正式报文名称、长度/空白规则和业务字典仍待定。

**允许为空**：True

**必填条件**：选填；新有效行提供时保存，未提供不导致导入失败。

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 字段提供时为原文本；编码不能按数值处理，Smartcode是不透明外部文本，不猜其业务算法。

2. 不新增必填/成对必填/强制枚举；历史缺值不补造，不批量覆盖已有记录。

**权限**

**read**

1. 当前有对象权限的运营/管理员/坐席；原记录所属业务系统的完成沟通回调

**write**

1. 本次导入调用方/原手工输入，服务端保存；本轮显示原导入信息只读，未新增坐席修改导入原值操作

**生命周期**

#### 1

**state**：新导入

**行为**：逐行保存本次提供的原文本；缺值不失败。

#### 2

**state**：预览/客户及通话详情/早填单

**行为**：展示准确原导入值，未填显示未提供；选填在必填之后，不加页面/技术编码输入。

#### 3

**state**：完成沟通快照/补送

**行为**：冻结原app/tenant/record/call关联的本次六字段，补送用原快照，不读最新同号或其他来源值。

**派生规则**

**kind**：external_input

**rule**：Smartcode来自本次原业务系统导入行或原手工选填列；保持字符串前导零、大小写，不从手机号/其他通话/计划到店门店推导。正式报文名称、长度/空白规则和业务字典仍待定。

**dependencies**

1. DFIELD-010

2. DFIELD-037

3. DFIELD-041

**保存**

**kind**：stored

**保存时机**：首次有效新行接收时保存并随客户/分配/本次通话来源快照传递；技术重传保原映射，人工方式不造预测批次。

**来源**：memory/normalized-user-stories.json#AC-099, memory/normalized-user-stories.json#AC-100, memory/normalized-user-stories.json#AC-101, inputs/source-index.json#SRC-124

**来源映射**：memory/normalized-user-stories.json#AC-099, memory/normalized-user-stories.json#AC-100, memory/normalized-user-stories.json#AC-101, inputs/source-index.json#SRC-124

**示例**

**valid**

1. 0007

**invalid**

1. 把其他租户/导入/通话的值按同手机号覆盖当前原值。

**验证引用**

1. CHECK-099

2. CHECK-100

3. CHECK-101

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：六个字段用户明确要求，选填/只读展示为本次工作假设；wire命名和生产存储映射待审，局部合成实现以新证据为准。

#### DFIELD-131 留资时间

**标识**：DFIELD-131

**名称**：留资时间

**entity**：ExternalImportRecord

**存储语义键**：leadCreatedAt

**类型**：source date-time string (proposed)

**格式**：业务来源记录的留资时间，选填原值，与平台导入时间importedAt和跟进保存时间savedAt分别保存；不默认当前时间，不按展示时浏览器时间重写。正式报文时间格式、时区/精度及兼容规则待定。

**允许为空**：True

**必填条件**：选填；新有效行提供时保存，未提供不导致导入失败。

**默认值**

**kind**：none

**value**：待核／未提供

**rule**：不从空值补业务身份或状态；未适用/历史缺失保留未知，正式必填阶段按规则校验。

**校验规则**

1. 本次来源原时间文本可缺省，缺失不失败也不补造；本方不会从平台导入时间/通话时间推导留资时间。

2. 正式时间格式、时区和精度规则未确定，不用本地示例当唯一格式，不因页面重载改变留资时间。

**权限**

**read**

1. 当前有对象权限的运营/管理员/坐席；原记录所属业务系统的完成沟通回调

**write**

1. 本次导入调用方/原手工输入，服务端保存；本轮显示原导入信息只读，未新增坐席修改导入原值操作

**生命周期**

#### 1

**state**：新导入

**行为**：逐行保存本次提供的原文本；缺值不失败。

#### 2

**state**：预览/客户及通话详情/早填单

**行为**：展示准确原导入值，未填显示未提供；选填在必填之后，不加页面/技术编码输入。

#### 3

**state**：完成沟通快照/补送

**行为**：冻结原app/tenant/record/call关联的本次六字段，补送用原快照，不读最新同号或其他来源值。

**派生规则**

**kind**：external_input

**rule**：业务来源记录的留资时间，选填原值，与平台导入时间importedAt和跟进保存时间savedAt分别保存；不默认当前时间，不按展示时浏览器时间重写。正式报文时间格式、时区/精度及兼容规则待定。

**dependencies**

1. DFIELD-010

2. DFIELD-037

3. DFIELD-041

**保存**

**kind**：stored

**保存时机**：首次有效新行接收时保存并随客户/分配/本次通话来源快照传递；技术重传保原映射，人工方式不造预测批次。

**来源**：memory/normalized-user-stories.json#AC-099, memory/normalized-user-stories.json#AC-100, memory/normalized-user-stories.json#AC-101, inputs/source-index.json#SRC-124

**来源映射**：memory/normalized-user-stories.json#AC-099, memory/normalized-user-stories.json#AC-100, memory/normalized-user-stories.json#AC-101, inputs/source-index.json#SRC-124

**示例**

**valid**

1. 业务系统提供的留资原时间，和平台导入/通话时间独立。

**invalid**

1. 未传时用当前平台时间填值，或用其他客户最新留资时间覆盖。

**验证引用**

1. CHECK-099

2. CHECK-100

3. CHECK-101

**状态**：design_proposal_unless_user_business_fact

**business_rule_ids**



**interface_note**：六个字段用户明确要求，选填/只读展示为本次工作假设；wire命名和生产存储映射待审，局部合成实现以新证据为准。
