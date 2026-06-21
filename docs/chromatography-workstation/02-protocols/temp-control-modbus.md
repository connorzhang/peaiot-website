# 8路温控模块 Modbus 通信协议开发说明书

## 1. 硬件接口与通信参数
- **物理接口**: RS-485
- **通信协议**: Modbus RTU
- **默认从机地址**: `20` (0x14)
- **波特率**: `9600`
- **数据位**: `8`
- **校验位**: 无校验 (`NONE`)
- **停止位**: `1`

---

## 2. 寄存器地址映射表

该温控模块包含 8 路独立的温度采集与控制通道，所有数据均可通过标准的 Modbus 功能码进行读写。

### 2.1 实时温度读取 (只读)
- **寄存器类型**: 保持寄存器 (Holding Register)
- **功能码**: `03` (Read Holding Registers)
- **起始地址**: `360` (十进制)
- **数据格式**: 32位单精度浮点数 (IEEE 754)
- **字节序**: **ABCD** (大端模式，高字在前，低字在后)
- **通道映射**:
  - 每路温度占用 2 个连续的 16 位寄存器。
  - 通道 1: 地址 `360` ~ `361`
  - 通道 2: 地址 `362` ~ `363`
  - ...
  - 通道 8: 地址 `374` ~ `375`
- **特殊状态值**: 
  - 当传感器未连接或断路时，仪表会返回占位值 `32767.00`。

### 2.2 设定温度读取与设置 (读写)
- **寄存器类型**: 保持寄存器 (Holding Register)
- **读取功能码**: `03` (Read Holding Registers)
- **写入功能码**: `06` (Write Single Register)
- **起始地址**: `42` (十进制)
- **数据格式**: 16位有符号整数 (直接表示温度值，**不需要放大10倍**)
- **通道映射**:
  - 每路设定温度占用 1 个 16 位寄存器。
  - 通道 1: 地址 `42`
  - 通道 2: 地址 `43`
  - ...
  - 通道 8: 地址 `49`
- **示例**: 若要将通道 1 的目标温度设定为 100℃，只需使用功能码 06 向地址 42 写入十进制数值 `100`。

### 2.3 断偶状态读取 (只读)
- **寄存器类型**: 离散输入/线圈状态 (Coils / Discrete Inputs)
- **读取功能码**: `01` (Read Coils) 或 `02` (Read Discrete Inputs)
- **起始地址**: `192` (十进制)
- **数据格式**: 1位布尔值 (Bit)
- **通道映射**:
  - 每路断偶状态占用 1 个 Bit。
  - 通道 1: 地址 `192`
  - 通道 2: 地址 `193`
  - ...
  - 通道 8: 地址 `199`
- **状态解析**:
  - `0`: 正常连接 (传感器状态良好)
  - `1`: 断偶告警 (传感器未连接或线路断开)

---

## 3. Python 开发参考示例

开发中推荐使用 `minimalmodbus` 库进行通信。

### 读取实时温度 (浮点数，ABCD字节序)
```python
import minimalmodbus
import serial
import struct

# 初始化
instrument = minimalmodbus.Instrument('COM12', 20)
instrument.serial.baudrate = 9600
instrument.serial.parity = serial.PARITY_EVEN
instrument.serial.timeout = 1

# 读取 16 个寄存器 (8路 x 2)
registers = instrument.read_registers(360, 16, functioncode=3)

# 解析通道 1 的浮点数 (使用 ABCD 字节序)
reg1, reg2 = registers[0], registers[1]
packed_data = struct.pack('>HH', reg2, reg1)
temp_ch1 = struct.unpack('>f', packed_data)[0]
```

### 读取设定温度 (16位整数)
```python
# 读取 8 个寄存器 (8路 x 1)
set_temps = instrument.read_registers(42, 8, functioncode=3)
print("通道 1 设定温度:", set_temps[0])
```

### 读取断偶状态 (Bit)
```python
# 读取 8 个连续位
states = instrument.read_bits(192, 8, functioncode=1)
# states[0] 为 1 代表通道 1 断偶，0 代表正常
```
另外加一个功能说明，这8路温度控制在寄存器78开始设置8个模式为1的话就是IO模式，也就是单独控制这个输出的开关，不用温度控制，控制使用02功能码的32寄存器开始，设1是开，0是关