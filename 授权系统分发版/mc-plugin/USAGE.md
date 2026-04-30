# BeaconAuth 集成指南

BeaconAuth 是一个用于验证 Beacon 平台付费插件授权的 Minecraft 插件。
其他开发者可以通过以下步骤将授权系统集成到自己的插件中。

## 1. 依赖设置

在您的插件 `plugin.yml` 中添加 `BeaconAuth` 作为依赖：

```yaml
name: MyPaidPlugin
version: 1.0.0
main: com.example.myplugin.MyPlugin
depend: [BeaconAuth] # 强制依赖
# 或者
# softdepend: [BeaconAuth] # 软依赖（如果不强制用户安装验证插件）
```

## 2. 代码集成

### 方法一：使用 AuthAPI (推荐)

在您的插件 `onEnable` 方法中调用验证接口：

```java
import com.beaconmc.auth.AuthAPI;
import org.bukkit.plugin.java.JavaPlugin;

public class MyPlugin extends JavaPlugin {

    @Override
    public void onEnable() {
        // 验证授权 (异步)
        AuthAPI.verify("MyPaidPlugin").thenAccept(isValid -> {
            if (isValid) {
                getLogger().info("授权验证成功！感谢您的购买。");
                //在此处初始化您的插件核心功能
                initPlugin();
            } else {
                getLogger().warning("授权验证失败！请购买正版插件。");
                // 禁用插件
                getServer().getPluginManager().disablePlugin(this);
            }
        }).exceptionally(ex -> {
            getLogger().severe("验证服务器连接失败: " + ex.getMessage());
            // 根据策略决定是否允许使用
            return null;
        });
    }

    private void initPlugin() {
        // 插件逻辑
    }
}
```

### 方法二：反射调用 (不依赖 jar)

如果您不想在编译时依赖 BeaconAuth，可以使用反射，但较为复杂。建议直接通过 Maven/Gradle 引入 BeaconAuth.jar 作为 provided 依赖。

## 3. 用户配置

用户在使用您的插件前，需要在 `plugins/BeaconAuth/config.yml` 中配置他们的 Beacon 账号以及每个插件的授权码（授权码可在 Beacon 平台「授权中心 → 我的授权」页面查看）：

```yaml
auth:
  account: "user123"

plugins:
  - name: "MyPaidPlugin"
    auth_code: "BC-A1B2C3D4E5F6G7H8"
```

## 4. Paper/Folia 支持

BeaconAuth 已经支持 Paper 和 Folia 服务端。
`AuthAPI.verify` 方法是异步的，不会阻塞主线程，因此在 Folia 中也是安全的。
注意：不要在 `thenAccept` 回调中直接操作 Bukkit API (如生成方块)，除非您确定当前上下文是安全的。建议使用 `getScheduler().runTask(this, ...)` (Spigot) 或 `getRegionScheduler().execute(...)` (Folia) 回到主线程/区域线程。

## 5. API 参考

- `AuthAPI.verify(String pluginName)`: 异步验证，返回 `CompletableFuture<Boolean>`。
- `AuthAPI.verifySync(String pluginName)`: 同步验证 (不推荐在主线程使用)。
