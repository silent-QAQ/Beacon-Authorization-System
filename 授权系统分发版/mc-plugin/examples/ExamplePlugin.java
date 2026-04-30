package com.example.plugin;

import com.beaconmc.auth.AuthAPI;
import org.bukkit.Bukkit;
import org.bukkit.plugin.java.JavaPlugin;

import java.util.concurrent.CompletableFuture;
import java.util.logging.Level;

/**
 * 一个集成 BeaconAuth 授权系统的示例插件
 * 
 * 在 plugin.yml 中添加依赖：
 * depend: [BeaconAuth]
 */
public class ExamplePlugin extends JavaPlugin {

    private static final String PLUGIN_NAME = "MyAwesomePlugin";

    @Override
    public void onEnable() {
        getLogger().info("正在启动 MyAwesomePlugin，验证授权中...");

        // 调用 BeaconAuth 异步验证 API
        AuthAPI.verify(PLUGIN_NAME)
            .thenAcceptAsync(isValid -> {
                // 回调在异步线程执行，所以不要在这里直接操作 Bukkit API
                // 必须切换回主线程（或 Folia 的调度器）
                
                // 兼容 Folia 的主线程调度
                runSync(() -> {
                    if (isValid) {
                        getLogger().info("授权验证成功！插件已激活。");
                        initPluginFeatures();
                    } else {
                        getLogger().warning("授权验证失败！您无权使用此插件。");
                        getLogger().warning("请确保在 plugins/BeaconAuth/config.yml 中配置了正确的 Beacon 账号和授权码，");
                        getLogger().warning("并且该账号已被授予使用 " + PLUGIN_NAME + " 的权限。");
                        
                        // 禁用插件
                        getServer().getPluginManager().disablePlugin(this);
                    }
                });
            })
            .exceptionally(throwable -> {
                runSync(() -> {
                    getLogger().log(Level.SEVERE, "验证过程中发生错误", throwable);
                    getServer().getPluginManager().disablePlugin(this);
                });
                return null;
            });
    }

    private void runSync(Runnable task) {
        if (Bukkit.getVersion().contains("Folia")) {
             // Folia 全局调度器
             Bukkit.getGlobalRegionScheduler().execute(this, task);
        } else {
             // Spigot/Paper 主线程调度器
             Bukkit.getScheduler().runTask(this, task);
        }
    }

    private void initPluginFeatures() {
        // 只有验证成功后才加载功能
        getLogger().info("注册命令...");
        getCommand("example").setExecutor((sender, command, label, args) -> {
            sender.sendMessage("ExamplePlugin 正在运行！");
            return true;
        });
        
        getLogger().info("注册监听器...");
        // getServer().getPluginManager().registerEvents(new MyListener(), this);
    }
}
