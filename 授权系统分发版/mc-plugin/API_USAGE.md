# BeaconAuth API 使用指南

BeaconAuth 是一个为 Minecraft 服务器插件提供授权验证的系统。本指南将帮助开发者将 BeaconAuth 集成到自己的插件中。

## 1. 依赖配置

首先，你需要将 BeaconAuth 作为依赖添加到你的插件中。

### Maven (pom.xml)

如果你有私有仓库，可以上传 `BeaconAuth.jar`。或者，你可以将 jar 安装到本地仓库：

```bash
mvn install:install-file -Dfile=BeaconAuth-1.0.0.jar -DgroupId=com.beaconmc -DartifactId=BeaconAuth -Dversion=1.0.0 -Dpackaging=jar
```

然后在 `pom.xml` 中添加依赖：

```xml
<dependency>
    <groupId>com.beaconmc</groupId>
    <artifactId>BeaconAuth</artifactId>
    <version>1.0.0</version>
    <scope>provided</scope>
</dependency>
```

### plugin.yml / paper-plugin.yml

在你的 `plugin.yml` 中添加依赖，确保 BeaconAuth 在你的插件之前加载：

```yaml
name: YourPlugin
version: 1.0.0
main: com.yourpackage.YourPlugin
depend: [BeaconAuth]
```

## 2. API 调用

BeaconAuth 提供了简单的静态方法来验证授权。

### 异步验证 (推荐)

在插件启动时进行异步验证，验证通过后再注册监听器或命令。

```java
import com.beaconmc.auth.AuthAPI;
import org.bukkit.plugin.java.JavaPlugin;

public class YourPlugin extends JavaPlugin {

    @Override
    public void onEnable() {
        // 插件名称必须与 Beacon 平台上发布的名称一致
        String pluginName = "YourPluginName";

        AuthAPI.verify(pluginName).thenAccept(isValid -> {
            if (isValid) {
                getLogger().info("授权验证成功！插件正在启动...");
                // 在这里初始化你的插件逻辑
                // 注意：这里是异步线程，如果需要调用 Bukkit API (如注册监听器)，需要切换回主线程
                getServer().getScheduler().runTask(this, () -> {
                    initPlugin();
                });
            } else {
                getLogger().warning("授权验证失败！插件将被禁用。");
                getServer().getPluginManager().disablePlugin(this);
            }
        }).exceptionally(e -> {
            getLogger().severe("验证过程中发生错误: " + e.getMessage());
            getServer().getPluginManager().disablePlugin(this);
            return null;
        });
    }

    private void initPlugin() {
        // 注册命令、监听器等
        getLogger().info("插件逻辑已加载！");
    }
}
```

### 同步验证 (不推荐，仅限 onEnable)

如果你必须在 `onEnable` 中阻塞等待结果（例如为了简化逻辑），可以使用 `verifySync`。但请注意，这会暂时卡住服务器启动过程。

```java
import com.beaconmc.auth.AuthAPI;
import org.bukkit.plugin.java.JavaPlugin;

public class YourPlugin extends JavaPlugin {

    @Override
    public void onEnable() {
        if (!AuthAPI.verifySync("YourPluginName")) {
            getLogger().warning("授权验证失败！");
            getServer().getPluginManager().disablePlugin(this);
            return;
        }

        getLogger().info("授权验证成功！");
        // 继续加载插件...
    }
}
```

## 3. 配置文件 (config.yml)

服务器管理员需要在 `BeaconAuth/config.yml` 中配置他们的 Beacon 账号以及每个插件的授权码（授权码可在 Beacon 平台「授权中心 → 我的授权」页面查看）：

```yaml
auth:
  account: "MyUsername"
  api-url: "http://your-beacon-site.com/api/authorizations/verify"

plugins:
  - name: "YourPluginName"
    auth_code: "BC-A1B2C3D4E5F6G7H8"
```

## 4. Folia 支持

BeaconAuth 及其 API 完全支持 Paper 和 Folia 服务端。
- `AuthAPI.verify` 使用 Java 原生 `CompletableFuture`，不依赖 Bukkit 调度器，因此在 Folia 上也是安全的。
- 在回调中操作 Bukkit API 时，请确保使用正确的调度器（`GlobalRegionScheduler` 或 `RegionScheduler`）。

```java
// Folia 兼容的调度示例
import io.papermc.paper.threadedregions.scheduler.GlobalRegionScheduler;

// ... inside callback
if (Bukkit.getServer().getPluginManager().isPluginEnabled("Folia")) {
     Bukkit.getGlobalRegionScheduler().run(this, (task) -> initPlugin());
} else {
     Bukkit.getScheduler().runTask(this, () -> initPlugin());
}
```
