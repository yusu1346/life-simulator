// 存档系统

class SaveSystem {
    constructor() {
        this.dbName = 'LifeSimulatorDB';
        this.storeName = 'saves';
        this.db = null;
        this.init();
    }
    
    // 初始化IndexedDB
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }
    
    // 保存游戏
    async save() {
        if (!Game.character) return;
        
        const saveData = {
            id: 'current_save',
            character: Game.character,
            familyTree: GameData.familyTree,
            achievements: Game.character.achievements,
            timestamp: Date.now(),
            version: '2.0'
        };
        
        try {
            const db = await this.init();
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            store.put(saveData);
            
            this.showSaveNotification('✅ 游戏已保存');
        } catch (error) {
            console.error('保存失败:', error);
            this.showSaveNotification('❌ 保存失败');
        }
    }
    
    // 自动保存
    async autoSave() {
        if (!Game.character || !Game.isPlaying) return;
        
        // 每5年保存一次
        if (Game.character.age % 5 === 0) {
            await this.save();
        }
    }
    
    // 加载游戏
    async load() {
        try {
            const db = await this.init();
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            
            const request = store.get('current_save');
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    const data = request.result;
                    if (data) {
                        resolve(data);
                    } else {
                        reject('没有找到存档');
                    }
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('加载失败:', error);
            return null;
        }
    }
    
    // 删除存档
    async deleteSave() {
        try {
            const db = await this.init();
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            store.delete('current_save');
        } catch (error) {
            console.error('删除失败:', error);
        }
    }
    
    // 显示保存提示
    showSaveNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

// 创建全局实例
const SaveSystem = new SaveSystem();
