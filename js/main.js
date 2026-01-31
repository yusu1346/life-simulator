// 主入口文件

// 初始化游戏
const Game = new Game();

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', async () => {
    // 检查是否有存档
    try {
        const savedData = await SaveSystem.load();
        if (savedData) {
            setTimeout(() => {
                if (confirm('检测到存档，是否加载之前保存的游戏？')) {
                    loadGame(savedData);
                }
            }, 1000);
        }
    } catch (error) {
        console.log('没有存档或存档已损坏');
    }
    
    // 添加键盘快捷键
    document.addEventListener('keydown', (e) => {
        if (!Game.isPlaying || !Game.character) return;
        
        // 空格键 - 下一年
        if (e.code === 'Space') {
            e.preventDefault();
            Game.nextYear();
        }
        
        // Ctrl+S - 保存
        if (e.code === 'KeyS' && e.ctrlKey) {
            e.preventDefault();
            SaveSystem.save();
        }
    });
});

// 加载游戏
async function loadGame(data) {
    // 重建角色对象
    const c = data.character;
    Game.character = new Character(c.name, c.gender, c.familyType);
    
    // 复制属性
    Object.assign(Game.character, c);
    
    // 重建方法
    Game.character.getStage = function() {
        if (this.age < 3) return '婴儿期';
        if (this.age < 12) return '童年期';
        if (this.age < 18) return '青春期';
        if (this.age < 60) return '成年期';
        return '老年期';
    };
    Game.character.isAlive = function() {
        return this.health > 0 && this.age < 100;
    };
    
    // 恢复数据
    GameData.familyTree = data.familyTree;
    Game.isPlaying = true;
    
    // 切换到游戏界面
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('main-screen').classList.add('active');
    
    // 更新UI
    Game.updateUI();
    Game.showEvent('加载成功', `欢迎回到游戏！继续${Game.character.name}的人生`);
}

// 全局函数（供HTML调用）
window.selectGender = (gender) => Game.selectGender(gender);
window.selectFamily = (familyType) => Game.selectFamily(familyType);
window.nextYear = () => Game.nextYear();
window.saveGame = () => SaveSystem.save();
window.inheritLife = (childId) => Game.inheritLife(childId);

// 导出到全局
window.Game = Game;
window.SaveSystem = SaveSystem;
