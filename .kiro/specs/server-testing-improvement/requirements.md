# مستندات الزامات

## مقدمه

این سیستم برای بهبود کیفیت تست سرورهای VPN طراحی شده است. هدف اصلی افزایش نرخ موفقیت تست از 50% (75 از 150 سرور) به حداقل 90% (135 از 150 سرور) است. سیستم باید تست‌های سرسختانه و دقیق‌تری انجام دهد تا فقط سرورهای با کیفیت بالا به عنوان فعال شناسایی شوند.

## واژه‌نامه

- **ServerTester**: سیستم تست‌کننده سرورها که مسئول اجرای تست‌های مختلف است
- **QualityScore**: امتیاز کیفیت سرور که از 0 تا 100 است
- **StabilityTest**: تست پایداری که اتصال سرور را در طول زمان بررسی می‌کند
- **LatencyTest**: تست تاخیر که زمان پاسخ سرور را اندازه‌گیری می‌کند
- **OperatorTest**: تست سازگاری با اپراتورهای مختلف ایران
- **ConfigValidator**: سیستم اعتبارسنجی کانفیگ سرور
- **GeoScoring**: امتیازدهی بر اساس موقعیت جغرافیایی سرور

## الزامات

### الزام 1: بهبود تست کیفیت اولیه

**User Story:** به عنوان کاربر، می‌خواهم سیستم تست‌های دقیق‌تری برای کیفیت اولیه سرورها انجام دهد تا سرورهای نامعتبر زودتر حذف شوند.

#### معیارهای پذیرش

1. WHEN THE ServerTester receives a server configuration, THE ServerTester SHALL validate the IP address format using strict regex pattern
2. WHEN THE ServerTester validates port number, THE ServerTester SHALL verify the port is between 1 and 65535
3. WHEN THE ServerTester checks server name, THE ServerTester SHALL require minimum 3 characters length
4. WHEN THE ServerTester validates protocol, THE ServerTester SHALL accept only vmess, vless, trojan, or ss protocols
5. WHEN THE ServerTester calculates quality score, THE ServerTester SHALL require minimum 4 out of 5 quality tests to pass

### الزام 2: تست پایداری چندمرحله‌ای

**User Story:** به عنوان کاربر، می‌خواهم سرورها از نظر پایداری در چند مرحله تست شوند تا سرورهای ناپایدار شناسایی شوند.

#### معیارهای پذیرش

1. WHEN THE ServerTester performs stability test, THE ServerTester SHALL execute 5 consecutive connection attempts
2. WHEN THE ServerTester evaluates stability results, THE ServerTester SHALL require minimum 4 out of 5 successful attempts
3. WHEN THE ServerTester detects connection failure, THE ServerTester SHALL wait 10 milliseconds before retry
4. WHEN THE ServerTester completes stability test, THE ServerTester SHALL calculate stability percentage
5. IF stability percentage is below 80 percent, THEN THE ServerTester SHALL mark server as unstable

### الزام 3: تست تاخیر دقیق‌تر

**User Story:** به عنوان کاربر، می‌خواهم تست تاخیر دقیق‌تر باشد تا سرورهای کند شناسایی شوند.

#### معیارهای پذیرش

1. WHEN THE ServerTester measures latency, THE ServerTester SHALL perform 3 separate latency measurements
2. WHEN THE ServerTester calculates final latency, THE ServerTester SHALL use median of 3 measurements
3. IF median latency exceeds 200 milliseconds, THEN THE ServerTester SHALL mark server as slow
4. WHEN THE ServerTester detects latency spike, THE ServerTester SHALL perform additional verification test
5. WHEN THE ServerTester completes latency test, THE ServerTester SHALL store all measurement values

### الزام 4: تست سازگاری اپراتور

**User Story:** به عنوان کاربر، می‌خواهم سرورها با اپراتورهای مختلف ایران تست شوند تا سازگاری آنها مشخص شود.

#### معیارهای پذیرش

1. WHEN THE ServerTester tests operator compatibility, THE ServerTester SHALL test all 5 Iranian operators
2. WHEN THE ServerTester evaluates operator results, THE ServerTester SHALL require minimum 3 out of 5 operators to work
3. WHEN THE ServerTester tests MCI operator, THE ServerTester SHALL use success threshold of 85 percent
4. WHEN THE ServerTester tests Irancell operator, THE ServerTester SHALL use success threshold of 80 percent
5. IF less than 3 operators work, THEN THE ServerTester SHALL mark server as incompatible

### الزام 5: اعتبارسنجی کانفیگ پیشرفته

**User Story:** به عنوان کاربر، می‌خواهم کانفیگ سرورها به صورت کامل اعتبارسنجی شوند تا سرورهای با کانفیگ نادرست حذف شوند.

#### معیارهای پذیرش

1. WHEN THE ConfigValidator validates vmess config, THE ConfigValidator SHALL decode base64 and parse JSON structure
2. WHEN THE ConfigValidator validates vless config, THE ConfigValidator SHALL verify URL format and required parameters
3. WHEN THE ConfigValidator checks config length, THE ConfigValidator SHALL require minimum 40 characters
4. WHEN THE ConfigValidator validates protocol-specific fields, THE ConfigValidator SHALL verify all required fields exist
5. IF config validation fails, THEN THE ConfigValidator SHALL mark server as invalid

### الزام 6: تست سرعت دانلود

**User Story:** به عنوان کاربر، می‌خواهم سرعت دانلود سرورها تست شود تا سرورهای کند شناسایی شوند.

#### معیارهای پذیرش

1. WHEN THE ServerTester performs speed test, THE ServerTester SHALL simulate download of 1 megabyte data
2. WHEN THE ServerTester calculates download speed, THE ServerTester SHALL measure speed in megabits per second
3. IF download speed is below 5 megabits per second, THEN THE ServerTester SHALL mark server as slow
4. WHEN THE ServerTester has low latency server, THE ServerTester SHALL expect higher download speed
5. WHEN THE ServerTester completes speed test, THE ServerTester SHALL store speed value in server config

### الزام 7: امتیازدهی جغرافیایی

**User Story:** به عنوان کاربر، می‌خواهم سرورهای نزدیک‌تر به ایران امتیاز بیشتری بگیرند.

#### معیارهای پذیرش

1. WHEN THE GeoScoring calculates location score, THE GeoScoring SHALL assign 10 points to Turkey and Azerbaijan
2. WHEN THE GeoScoring evaluates European servers, THE GeoScoring SHALL assign 8 to 9 points
3. WHEN THE GeoScoring evaluates Asian servers, THE GeoScoring SHALL assign 6 to 7 points
4. WHEN THE GeoScoring evaluates American servers, THE GeoScoring SHALL assign 5 to 6 points
5. WHEN THE GeoScoring completes scoring, THE GeoScoring SHALL add geo score to total quality score

### الزام 8: محاسبه امتیاز کل

**User Story:** به عنوان کاربر، می‌خواهم سیستم امتیاز کلی برای هر سرور محاسبه کند و فقط سرورهای با امتیاز بالا را فعال کند.

#### معیارهای پذیرش

1. WHEN THE ServerTester calculates total score, THE ServerTester SHALL sum all individual test scores
2. WHEN THE ServerTester evaluates final score, THE ServerTester SHALL require minimum 75 out of 100 points
3. IF total score is below 75 points, THEN THE ServerTester SHALL mark server as inactive
4. WHEN THE ServerTester assigns score weights, THE ServerTester SHALL give 25 points to stability test
5. WHEN THE ServerTester completes scoring, THE ServerTester SHALL log detailed score breakdown

### الزام 9: حذف سرورهای تکراری

**User Story:** به عنوان کاربر، می‌خواهم سرورهای تکراری قبل از تست حذف شوند تا منابع هدر نرود.

#### معیارهای پذیرش

1. WHEN THE ServerTester receives server list, THE ServerTester SHALL identify duplicate servers by address and port
2. WHEN THE ServerTester finds duplicates, THE ServerTester SHALL keep only first occurrence
3. WHEN THE ServerTester removes duplicates, THE ServerTester SHALL log number of removed servers
4. WHEN THE ServerTester compares servers, THE ServerTester SHALL check address, port, and protocol fields
5. WHEN THE ServerTester completes deduplication, THE ServerTester SHALL proceed with unique servers only

### الزام 10: گزارش‌دهی پیشرفته

**User Story:** به عنوان کاربر، می‌خواهم گزارش‌های دقیق از نتایج تست دریافت کنم.

#### معیارهای پذیرش

1. WHEN THE ServerTester completes each batch, THE ServerTester SHALL log success rate percentage
2. WHEN THE ServerTester finishes all tests, THE ServerTester SHALL report total active servers count
3. IF active servers count is below 135, THEN THE ServerTester SHALL display warning message
4. WHEN THE ServerTester logs results, THE ServerTester SHALL include detailed score breakdown for failed servers
5. WHEN THE ServerTester completes testing, THE ServerTester SHALL display final success rate with target comparison
