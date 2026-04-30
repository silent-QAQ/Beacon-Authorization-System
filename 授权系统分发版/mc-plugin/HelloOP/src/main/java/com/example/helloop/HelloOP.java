package com.example.helloop;

import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.plugin.java.JavaPlugin;

import java.lang.reflect.Method;
import java.util.concurrent.CompletableFuture;

public class HelloOP extends JavaPlugin implements Listener {

    @Override
    public void onEnable() {
        getServer().getPluginManager().registerEvents(this, this);
        verifyAuthorization();
        getLogger().info("HelloOP 插件已启动！");
    }

    private void verifyAuthorization() {
        if (!getServer().getPluginManager().isPluginEnabled("BeaconAuth")) {
            getLogger().warning("未检测到 BeaconAuth，跳过授权验证（插件仍可运行）");
            getLogger().warning("如需完整授权功能，请安装 BeaconAuth 插件并进行授权配置");
            return;
        }

        try {
            Class<?> authApiClass = Class.forName("com.beaconmc.auth.AuthAPI");
            Method verifyMethod = authApiClass.getMethod("verify", String.class);

            CompletableFuture<Boolean> future = (CompletableFuture<Boolean>) verifyMethod.invoke(null, "HelloOP");

            future.thenAccept(isValid -> {
                if (isValid) {
                    getLogger().info("==========================================");
                    getLogger().info("  授权验证成功！HelloOP 插件已激活");
                    getLogger().info("==========================================");
                } else {
                    getLogger().warning("==========================================");
                    getLogger().warning("  授权验证失败！");
                    getLogger().warning("  请在 BeaconAuth 的 config.yml 中配置 HelloOP 的授权码");
                    getLogger().warning("  授权码可在 Beacon 平台「授权中心 → 我的授权」查看");
                    getLogger().warning("==========================================");
                }
            }).exceptionally(ex -> {
                getLogger().severe("授权验证请求失败: " + ex.getMessage());
                return null;
            });
        } catch (Exception e) {
            getLogger().severe("调用 AuthAPI 失败: " + e.getMessage());
        }
    }

    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();

        if (!player.isOp()) {
            return;
        }

        getServer().getScheduler().runTaskLater(this, () -> {
            Bukkit.broadcastMessage("大家好");
        }, 20L);
    }

    @Override
    public void onDisable() {
        getLogger().info("HelloOP 插件已停止。");
    }
}
