package com.beaconmc.auth;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.bukkit.Bukkit;
import org.bukkit.configuration.ConfigurationSection;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.logging.Level;

public class AuthManager {
    private final BeaconAuth plugin;

    public AuthManager(BeaconAuth plugin) {
        this.plugin = plugin;
    }

    public CompletableFuture<Boolean> verify(String pluginName) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // 1. 检查本地白名单配置
                List<Map<?, ?>> allowedPlugins = plugin.getConfig().getMapList("plugins");

                if (allowedPlugins == null || allowedPlugins.isEmpty()) {
                    plugin.getLogger().warning("插件 [" + pluginName + "] 验证被拒绝。");
                    plugin.getLogger().warning("config.yml 中的 plugins 白名单为空！");
                    plugin.getLogger().warning("请务必在 config.yml 的 plugins 列表中添加您允许使用的插件名称和对应的授权码。");
                    return false;
                }

                // 查找插件的授权码
                String authCode = null;
                boolean found = false;
                for (Map<?, ?> entry : allowedPlugins) {
                    Object nameObj = entry.get("name");
                    if (nameObj != null && nameObj.toString().equals(pluginName)) {
                        found = true;
                        Object codeObj = entry.get("auth_code");
                        if (codeObj != null) {
                            authCode = codeObj.toString();
                        }
                        break;
                    }
                }

                if (!found) {
                    plugin.getLogger().warning("插件 [" + pluginName + "] 未在 config.yml 的白名单中，拒绝验证。");
                    plugin.getLogger().warning("如果您希望在此服务器使用该插件，请将其添加到 config.yml 的 plugins 列表中。");
                    return false;
                }

                if (authCode == null || authCode.isEmpty()) {
                    plugin.getLogger().warning("插件 [" + pluginName + "] 未配置授权码（auth_code），请在 config.yml 中填写。");
                    plugin.getLogger().warning("授权码可在 Beacon 平台「授权中心 → 我的授权」页面查看。");
                    return false;
                }

                String apiUrl = plugin.getConfig().getString("auth.api-url");
                if (apiUrl == null || apiUrl.isEmpty()) {
                    plugin.getLogger().warning("未配置 auth.api-url，验证失败！");
                    return false;
                }

                String account = plugin.getConfig().getString("auth.account");

                if (account == null || account.isEmpty()) {
                    plugin.getLogger().warning("未配置 auth.account，请在 config.yml 中填写 Beacon 账号！");
                    return false;
                }

                // 获取服务器信息
                String serverIp = Bukkit.getIp();
                if (serverIp == null || serverIp.isEmpty()) {
                    serverIp = "127.0.0.1";
                }
                int serverPort = Bukkit.getPort();

                // 构建请求体
                JsonObject json = new JsonObject();
                json.addProperty("account", account);
                json.addProperty("auth_code", authCode);
                json.addProperty("plugin_name", pluginName);
                json.addProperty("server_ip", serverIp);
                json.addProperty("server_port", serverPort);

                if (plugin.getConfig().getBoolean("debug")) {
                    plugin.getLogger().info("正在验证插件: " + pluginName);
                    plugin.getLogger().info("API URL: " + apiUrl);
                    plugin.getLogger().info("Account: " + account);
                    plugin.getLogger().info("Auth Code: " + authCode);
                }

                URL url = new URL(apiUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("User-Agent", "BeaconAuth/1.0");
                conn.setDoOutput(true);
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);

                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = json.toString().getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }

                int code = conn.getResponseCode();
                if (code == 200) {
                    StringBuilder response = new StringBuilder();
                    try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                        String responseLine;
                        while ((responseLine = br.readLine()) != null) {
                            response.append(responseLine.trim());
                        }
                    }

                    if (plugin.getConfig().getBoolean("debug")) {
                        plugin.getLogger().info("Response: " + response.toString());
                    }

                    JsonObject res = JsonParser.parseString(response.toString()).getAsJsonObject();
                    boolean valid = res.has("valid") && res.get("valid").getAsBoolean();
                    String message = res.has("message") ? res.get("message").getAsString() : "";

                    if (valid) {
                        plugin.getLogger().info("插件 [" + pluginName + "] 授权验证成功！");
                        if (res.has("expires_at") && !res.get("expires_at").isJsonNull()) {
                            String expiresAt = res.get("expires_at").getAsString();
                            plugin.getLogger().info("授权过期时间: " + expiresAt);
                        }
                        return true;
                    } else {
                        plugin.getLogger().warning("插件 [" + pluginName + "] 授权验证失败: " + message);
                        return false;
                    }
                } else {
                    plugin.getLogger().warning("授权服务器返回错误代码: " + code);
                    try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                        StringBuilder errResponse = new StringBuilder();
                        String line;
                        while ((line = br.readLine()) != null) {
                            errResponse.append(line);
                        }
                        plugin.getLogger().warning("错误详情: " + errResponse.toString());
                    } catch (Exception ignored) {}

                    return false;
                }
            } catch (Exception e) {
                plugin.getLogger().log(Level.SEVERE, "验证插件 [" + pluginName + "] 时发生错误", e);
                return false;
            }
        });
    }
}
