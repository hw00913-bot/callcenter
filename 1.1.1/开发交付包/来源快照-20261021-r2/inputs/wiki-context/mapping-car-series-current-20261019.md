# Mapping车系接口当前事实（净化快照）

来源页 `lib-车系编码映射接口`，raw引用 `raw/car-series-code-mapping-api@v1`，Wiki更新时间2026-10-19，文档修订v1.1，状态partial。只读指定页面，未读取raw、运行示例或发出请求。

GET `/mapping/api/open/mapping-car-series/code`，brand_id、is_nev_car_type_flag、media_id、car_state均为选填query；media_id缺失/空串用10，car_state缺失/空串用1，0保留。品牌和新能源标记仅传入时过滤；固定启用车系且须有指定媒体映射。返回裸数组，每项name/string、relation_id/integer、car_state/integer、media_car_series_id/string。operator头可选默认nissan，文档称不校验身份，不可当认证凭证。

本快照不包含示例主数据、SQL或命令。主机、部署鉴权/权限、状态枚举、异常、排序/唯一性及真实响应仍待核验，不能推定与DCC编码同源。实施选择另由产品草稿记载，不提升为接口已验证。
